# Project Management Dashboard

## Overview

This is a responsive, interactive web-based dashboard application for monitoring all projects in an organization. The dashboard provides comprehensive project oversight with KPI cards, interactive charts, and detailed project tables. It features real-time data visualization for project status, budget variance analysis, and performance metrics across different organizational divisions.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes (August 16, 2025)

### Migration Completed
- Successfully migrated project from Replit Agent to Replit environment
- Updated data schema to include new margin fields: ProjectedGross Margin (%), Actual GrossMargin (%), % Deviation of the Profit Margin
- Modified KPI cards to be smaller width and removed active/completed projects, added total risks counter
- Updated charts to use Performance Category for project status pie chart instead of calculated performance index
- Enhanced project table with new margin columns and performance category display
- All chart data now sourced from dedicated API endpoints for better performance

### New Features Added
- Performance Category statistics API endpoint
- Spending Categories statistics API endpoint  
- Division statistics API endpoint
- Enhanced project data model with margin calculations
- Real-time chart updates using proper API data sources

## System Architecture

### Frontend Architecture
The frontend is built using React with TypeScript, utilizing a modern component-based architecture:

- **Framework**: React 18 with TypeScript for type safety
- **Styling**: Tailwind CSS for utility-first styling with shadcn/ui component library
- **State Management**: TanStack Query (React Query) for server state management
- **Routing**: Wouter for lightweight client-side routing
- **UI Components**: Comprehensive shadcn/ui component system with Radix UI primitives
- **Charts**: Recharts library for data visualization (pie charts, bar charts)
- **Theme Support**: Dark/light mode toggle with system preference detection

### Backend Architecture
The backend follows a REST API pattern using Express.js:

- **Framework**: Express.js with TypeScript
- **Database ORM**: Drizzle ORM for type-safe database operations
- **API Structure**: RESTful endpoints for project CRUD operations and analytics
- **Data Storage**: In-memory storage implementation with interface for easy database integration
- **Validation**: Zod schemas for request/response validation

### Database Design
PostgreSQL database with Drizzle ORM providing:

- **Projects Table**: Comprehensive project data including budget, timeline, and performance metrics
- **Schema Validation**: Type-safe database operations with generated TypeScript types
- **Migrations**: Drizzle Kit for database schema management
- **Performance Metrics**: JSON fields for flexible storage of EV, PV, AC, CPI, SPI calculations

### Key Features Architecture

**Dashboard Components**:
- Header with organization branding, global filters, and theme toggle
- KPI cards displaying project statistics and financial metrics
- Charts section with spending categories and project status visualizations
- Interactive project table with sorting, filtering, and detailed modal views

**Data Flow**:
- React Query handles API calls with caching and background updates
- Centralized filter state management for dashboard-wide filtering
- Real-time chart updates based on filter selections
- Modal-based detailed project views with comprehensive project information

**Performance Considerations**:
- Optimistic updates for responsive user interactions
- Efficient re-rendering with React Query's intelligent caching
- Responsive design patterns for mobile and desktop compatibility

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: PostgreSQL database connection for Neon DB
- **drizzle-orm**: Type-safe ORM for database operations
- **drizzle-kit**: Database migration and schema management tools

### UI and Styling
- **@radix-ui/***: Accessible, unstyled UI primitives for complex components
- **tailwindcss**: Utility-first CSS framework
- **class-variance-authority**: Utility for creating variant-based component APIs
- **lucide-react**: Icon library with consistent design

### Data Management
- **@tanstack/react-query**: Server state management and caching
- **@hookform/resolvers**: Form validation integration
- **zod**: Runtime type checking and validation
- **date-fns**: Date manipulation utilities

### Charts and Visualization
- **recharts**: React charting library for data visualization
- **embla-carousel-react**: Carousel component for responsive layouts

### Development Tools
- **vite**: Fast build tool and development server
- **typescript**: Static type checking
- **@replit/vite-plugin-runtime-error-modal**: Development error handling
- **wouter**: Minimalist routing library for React

The application is designed to be easily deployable on Replit with built-in development tooling and error handling specifically configured for the Replit environment.