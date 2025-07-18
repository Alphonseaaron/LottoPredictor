# AutoJackpot Predictor - SportPesa Edition

## Overview

This is a full-stack web application built to automate jackpot predictions for SportPesa's 17-match jackpot. The application provides an intelligent prediction system that combines football data analysis with proven statistical strategies to generate optimal betting combinations.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **Styling**: Tailwind CSS with shadcn/ui component library
- **State Management**: TanStack Query for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Build Tool**: Vite for fast development and optimized builds

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **Database**: PostgreSQL with Drizzle ORM
- **Database Provider**: Neon Database (serverless PostgreSQL)
- **API**: RESTful API with JSON responses

### Development Environment
- **Deployment**: Optimized for Replit with custom Vite plugins
- **Type Safety**: Full TypeScript coverage across client, server, and shared code
- **Code Organization**: Monorepo structure with shared schema definitions

## Key Components

### Database Schema
The application uses three main entities:
- **Jackpots**: Store jackpot information (amount, draw date, status)
- **Fixtures**: Individual football matches within a jackpot
- **Predictions**: AI-generated predictions with confidence scores and reasoning

### Prediction Engine
- **Algorithm**: Advanced prediction system considering team form, historical data, and statistical patterns
- **Strategies**: Multiple prediction strategies (balanced, conservative, aggressive)
- **Risk Management**: Configurable risk levels and wildcard options
- **Confidence Scoring**: Each prediction includes confidence levels and reasoning

### User Interface
- **Dashboard**: Main interface showing current jackpot and fixtures
- **Prediction Management**: Tools to generate, view, and export predictions
- **Data Input**: Support for manual fixture entry and bulk import
- **Export Functionality**: CSV export for betting convenience

## Data Flow

1. **Jackpot Creation**: System creates or fetches current jackpot information
2. **Fixture Management**: Users can input or import fixture data for 17 matches
3. **Prediction Generation**: AI algorithm analyzes fixtures and generates predictions
4. **Result Display**: Predictions shown with confidence scores and reasoning
5. **Export**: Users can export predictions as CSV for betting platforms

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: Serverless PostgreSQL connection
- **drizzle-orm**: Type-safe database ORM
- **@tanstack/react-query**: Server state management
- **@radix-ui/***: Accessible UI components
- **class-variance-authority**: Type-safe CSS variants
- **zod**: Runtime type validation

### Development Dependencies
- **Vite**: Build tool and development server
- **TypeScript**: Type checking and compilation
- **Tailwind CSS**: Utility-first CSS framework
- **ESBuild**: Fast JavaScript bundler for production

## Deployment Strategy

### Development
- **Hot Reload**: Vite development server with HMR
- **Error Handling**: Runtime error overlay for debugging
- **Environment**: Development-specific configurations and logging

### Production
- **Build Process**: Vite builds client, ESBuild bundles server
- **Database**: Drizzle migrations with PostgreSQL
- **Environment Variables**: DATABASE_URL for database connection
- **Static Assets**: Optimized client bundle served by Express

### Database Management
- **Migrations**: Drizzle Kit for schema migrations
- **Schema**: Shared TypeScript definitions between client and server
- **Connection**: Serverless PostgreSQL with connection pooling

The application is designed as a comprehensive prediction tool that can evolve from basic fixture management to advanced scraping and analysis capabilities. The modular architecture allows for easy extension with additional features like user authentication, historical analysis, and integration with external sports data APIs.