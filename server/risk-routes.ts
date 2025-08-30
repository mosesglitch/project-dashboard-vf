import { Router } from "express";
import { MongoClient, ObjectId } from "mongodb";
import { z } from "zod";
import { connectToDatabase } from "./mongodb";
const router = Router();

// Risk schema validation
const RiskSchema = z.object({
  projectCode: z.string(),
  title: z.string().min(1),
  description: z.string(),
  status: z.enum(["active", "resolved", "mitigated"]),
  priority: z.enum(["low", "medium", "high", "critical"]),
  owner: z.string(),
});

const UpdateRiskSchema = RiskSchema.partial().omit({ projectCode: true });

// MongoDB connection
let db: any = null;

async function getDatabase() {
  const { db } = await connectToDatabase();
  return db;
}


// Get risks by project code
router.get("/", async (req, res) => {
  try {
    const { projectCode } = req.query;
    
    if (!projectCode) {
      return res.status(400).json({ error: "Project code is required" });
    }

    const database = await getDatabase();
    const risks = await database
      .collection("risks")
      .find({ projectCode })
      .sort({ createdAt: -1 })
      .toArray();

    res.json(risks);
  } catch (error) {
    console.error("Error fetching risks:", error);
    res.status(500).json({ error: "Failed to fetch risks" });
  }
});

// Create new risk
router.post("/", async (req, res) => {
  try {
    const validatedData = RiskSchema.parse(req.body);
    const database = await getDatabase();

    const newRisk = {
      ...validatedData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await database.collection("risks").insertOne(newRisk);
    const createdRisk = await database
      .collection("risks")
      .findOne({ _id: result.insertedId });

    res.status(201).json(createdRisk);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation error", details: error.errors });
    }
    console.error("Error creating risk:", error);
    res.status(500).json({ error: "Failed to create risk" });
  }
});

// Update risk
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const validatedData = UpdateRiskSchema.parse(req.body);
    const database = await getDatabase();

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid risk ID" });
    }

    const updateData = {
      ...validatedData,
      updatedAt: new Date(),
    };

    const result = await database
      .collection("risks")
      .updateOne({ _id: new ObjectId(id) }, { $set: updateData });

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: "Risk not found" });
    }

    const updatedRisk = await database
      .collection("risks")
      .findOne({ _id: new ObjectId(id) });

    res.json(updatedRisk);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation error", details: error.errors });
    }
    console.error("Error updating risk:", error);
    res.status(500).json({ error: "Failed to update risk" });
  }
});

// Delete risk
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const database = await getDatabase();

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid risk ID" });
    }

    const result = await database
      .collection("risks")
      .deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: "Risk not found" });
    }

    res.json({ message: "Risk deleted successfully" });
  } catch (error) {
    console.error("Error deleting risk:", error);
    res.status(500).json({ error: "Failed to delete risk" });
  }
});

export default router;