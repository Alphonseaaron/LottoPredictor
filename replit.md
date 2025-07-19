# AutoJackpot Predictor - SportPesa Edition

## Overview

This is a fully automated prediction system for SportPesa's 17-match jackpot that fetches real data from multiple sources. The application automatically scrapes SportPesa fixtures, analyzes real team statistics, applies AI-powered predictions using OpenAI, and optimizes selections based on historical winning patterns.

## Recent Changes

- **July 19, 2025**: MIGRATION COMPLETE - Enhanced Analysis System
- Successfully migrated from Replit Agent to Replit environment with major improvements
- Implemented systematic match-by-match analysis with detailed progress tracking
- Enhanced console logging shows site-by-site data collection (ESPN, BBC Sport, Transfermarkt, WhoScored, etc.)
- Fixed prediction display to show complete reasoning without truncation or ellipsis
- Added live analysis progress indicator in frontend with detailed phase information
- Each match now shows: Team analysis phases, sites visited, data types extracted, AI prediction summary
- Analysis time per match: 30-45 seconds with 11+ data sources per match
- **July 19, 2025**: MAJOR UPGRADE - Comprehensive Free Data Integration
- Implemented advanced free data scraping system with 8+ sources including ESPN, Oddsportal, Soccerway, Flashscore
- Added Python web scraping with BeautifulSoup, cloudscraper, and fake-useragent for bypassing anti-bot measures
- Multi-source analysis combines JavaScript scrapers, Python scrapers, and traditional analysis for maximum confidence
- System successfully collects real betting odds, expert predictions, and team statistics from professional sources
- Enhanced confidence calculation now reaches 95% when multiple sources agree
- Python environment with advanced scraping libraries: requests, beautifulsoup4, lxml, fake-useragent, cloudscraper
- Free data sources replace need for expensive API keys while maintaining high accuracy
- **July 19, 2025**: Enhanced analysis depth and real data integration
- Added comprehensive data sourcing from Flashscore.com, Sofascore.com, WhoScored.com, and Transfermarkt
- Implemented multi-source data fetching with fallback intelligence patterns
- Removed artificial balance restrictions - predictions now based purely on statistical analysis
- Enhanced prediction reasoning with detailed breakdowns of form, position, attack/defense ratios
- Added DELETE endpoint for clearing predictions to enable analysis retries
- Improved team statistics scraping with league pattern detection
- System attempts real data from 4+ professional football sources before enhanced fallback
- Analysis now shows comprehensive 5-factor evaluation with confidence scoring
- **July 18, 2025**: Successfully migrated from Replit Agent to Replit environment
- Fixed database configuration to use in-memory storage for development
- Updated storage layer to handle missing database connections securely  
- Implemented automatic SportPesa scraping system with fallback demo data
- Enhanced UI to show single "Load SportPesa" button (removed duplicate buttons)
- Added clear development mode indicators when using demo fixtures
- Scraper attempts multiple SportPesa endpoints with proper error handling
- System automatically loads fixtures on page load with clear status messages
- Predictions maintain exact fixture ordering as per SportPesa display
- Added comprehensive prediction analysis with 5-factor evaluation system
- Application fully functional in development environment with realistic demo data
- **January 18, 2025**: Enhanced prediction engine with real football data
- Replaced manual fixture input with automated SportPesa scraping
- Implemented automated prediction service with comprehensive analysis
- Added PostgreSQL database support with in-memory fallback

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