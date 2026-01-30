# WishtoBudget

**Turn your wishes into budget reality!** 🎯💰

WishtoBudget is a modern, self-hostable wishlist and budget management application that helps you organize your desires, track your spending, and make informed purchase decisions. Whether you're saving for gadgets, planning home improvements, or managing gift ideas, WishtoBudget provides a beautiful and intuitive interface to keep your financial goals on track.

## ✨ Why WishtoBudget?

- **Privacy First**: Self-hosted solution means your financial data stays under your control
- **Beautiful Design**: Clean, modern interface built with React and Tailwind CSS
- **Flexible Organization**: Create multiple wishlists for different categories (tech, home, gifts, etc.)
- **Budget Awareness**: Set spending limits and track how your purchases affect your budget
- **Complete History**: Never lose track of your financial decisions with full activity logging
- **Docker Ready**: Deploy in minutes with Docker and docker-compose
- **API Support**: Optional REST API for integration with other tools and automation
- **Custom Icons**: Upload custom images for each item to make your wishlists visually appealing

## 🎯 Key Features

- 📝 **Multiple Wishlists**: Create and manage unlimited wishlists with individual budgets
- 💰 **Budget Tracking**: Set budget limits and track spending for each wishlist
- 📊 **Total Savings Dashboard**: View combined budget across all wishlists at a glance
- 📜 **Activity History**: Complete history log of budget changes, item additions, and purchases
- 🎯 **Item Priority**: Set priority levels (1-5) for wishlist items to focus on what matters most
- 🖼️ **Custom Icons**: Upload custom images for items to make your wishlists visually stunning
- ✅ **Purchase Tracking**: Mark items as purchased and track actual spending
- 🔄 **Undo Purchases**: Made a mistake? Easily revert purchases
- 📱 **Responsive Design**: Works beautifully on desktop, tablet, and mobile devices
- 🔒 **API Security**: Optional API with secret key authentication
- 🐳 **Docker Support**: Easy deployment with Docker and docker-compose
- 💾 **SQLite Database**: Lightweight, serverless database with easy backups

## 🛠️ Tech Stack

- **Framework**: Next.js 16 with App Router and Server Actions
- **Database**: SQLite with Drizzle ORM for type-safe queries
- **UI Components**: shadcn/ui (Radix UI primitives)
- **Styling**: Tailwind CSS 4 with custom animations
- **Icons**: Lucide React
- **Image Processing**: Sharp for optimized image handling
- **TypeScript**: Full type safety throughout the application

## 🚀 Getting Started

### Prerequisites

- Node.js 20 or higher
- npm, yarn, or pnpm package manager
- (Optional) Docker and Docker Compose for containerized deployment

### Local Development

1. **Clone the repository**

```bash
git clone https://github.com/itzpere/budget-wishlist.git
cd wishtobudget
```

2. **Install dependencies**

```bash
npm install
```

3. **Initialize the database**

The database will be automatically created on first run. Optionally, you can run migrations manually:

```bash
npm run db:generate  # Generate migrations from schema
npm run db:migrate   # Apply migrations to database
```

4. **Start the development server**

```bash
npm run dev
```

5. **Open your browser**

Navigate to [http://localhost:3000](http://localhost:3000) and start managing your wishlists!

## 🐳 Docker Deployment

### Using Docker Compose (Recommended)

The easiest way to deploy WishtoBudget is using Docker Compose:

1. **Build and start the container**

```bash
docker compose up -d
```

The application will be available at [http://localhost:3000](http://localhost:3000)

2. **View logs**

```bash
docker compose logs -f wishtobudget
```

3. **Stop the container**

```bash
docker compose down
```

### Data Persistence

The SQLite database and uploaded icons are automatically persisted using Docker volumes:
- `budget-data`: Stores the SQLite database
- `budget-icons`: Stores uploaded item images

### Using Docker Directly

If you prefer to use Docker without Compose:

1. **Build the image**

```bash
docker build -t wishtobudget .
```

2. **Run the container**

```bash
docker run -d \
  -p 3000:3000 \
  -v $(pwd)/data:/app/data \
  -v $(pwd)/public/icons:/app/public/icons \
  --name wishtobudget \
  wishtobudget
```

### Production Deployment

For production environments, use the production compose file:

```bash
docker compose -f docker-compose.prod.yml up -d
```

This includes optimizations like resource limits, health checks, and enhanced security settings. See [DOCKER.md](DOCKER.md) for detailed Docker configuration and deployment options.

## 💡 Usage Guide

### Creating Your First Wishlist

1. Click the **"Add Wishlist"** button in the header
2. Enter a name (e.g., "Tech Gadgets", "Home Improvement")
3. Optionally add a description
4. Set a budget limit
5. Click **"Add Wishlist"**

### Adding Items to Your Wishlist

1. Click the **"Add Item"** button in the header
2. Select the target wishlist from the dropdown
3. Enter the item name and price
4. Set a priority level (1-5, where 5 is highest priority)
5. Optionally upload a custom icon/image
6. Click **"Add Item"**

### Managing Your Budget

1. Click the **"Update Budget"** button to adjust wishlist budgets
2. All budget changes are logged in the history
3. View your total combined budget on the main dashboard

### Tracking Purchases

1. Navigate to a wishlist by clicking on its card
2. Click on any item to open the details dialog
3. Click **"Mark as Purchased"** to track the purchase
4. The item will be visually marked and the budget will be updated
5. Use **"Undo Purchase"** if you need to revert

### Viewing History

1. Click the **History** icon (clock) in the header
2. View all activity including:
   - Wishlist creation and updates
   - Budget changes
   - Item additions and modifications
   - Purchase tracking
3. Filter and search through your complete activity log

### Settings & Configuration

1. Click the **Settings** icon (gear) in the header
2. **Currency**: Change your preferred currency symbol (default: $)
3. **API Access**: Enable/disable the REST API
4. **API Secret**: Set a secret key for API authentication (required when API is enabled)

## 🔌 API Integration

WishtoBudget includes an optional REST API for automation and integration with other tools.

### Enabling the API

1. Go to Settings
2. Enable "API Access"
3. Set an API secret key

### API Endpoints

All API requests require the `x-api-secret` header with your configured secret key.

#### Get All Data
```bash
GET /api/data
Headers: x-api-secret: your-secret-key
```

Returns all wishlists with their items.

#### Get History
```bash
GET /api/history
Headers: x-api-secret: your-secret-key
```

Returns the complete activity history.

#### Upload Item Icon
```bash
POST /api/upload-icon
Headers: x-api-secret: your-secret-key
Content-Type: multipart/form-data
Body: file (image file)
```

Uploads an icon and returns the URL.

#### Save Item Icon
```bash
POST /api/save-icon
Headers: x-api-secret: your-secret-key
Content-Type: application/json
Body: { "itemId": 123, "imageUrl": "/icons/image.png" }
```

Saves an icon URL to a specific item.

### Example Usage

```bash
# Get all wishlists
curl -H "x-api-secret: your-secret-key" http://localhost:3000/api/data

# Upload an icon
curl -X POST \
  -H "x-api-secret: your-secret-key" \
  -F "file=@path/to/icon.png" \
  http://localhost:3000/api/upload-icon
```

## 📁 Project Structure

```
wishtobudget/
├── src/
│   ├── app/
│   │   ├── actions.ts              # Server Actions for mutations
│   │   ├── globals.css             # Global styles
│   │   ├── layout.tsx              # Root layout with metadata
│   │   ├── page.tsx                # Main dashboard page
│   │   ├── api/                    # API routes
│   │   │   ├── cleanup-icons/      # Icon cleanup endpoint
│   │   │   ├── data/               # Get all data endpoint
│   │   │   ├── history/            # Get history endpoint
│   │   │   ├── save-icon/          # Save icon to item
│   │   │   └── upload-icon/        # Upload icon file
│   │   └── wishlist/
│   │       └── [id]/
│   │           └── page.tsx        # Individual wishlist detail page
│   ├── components/
│   │   ├── add-item-dialog.tsx
│   │   ├── add-wishlist-dialog.tsx
│   │   ├── battery-item-card.tsx
│   │   ├── budget-display.tsx
│   │   ├── delete-item-dialog.tsx
│   │   ├── delete-wishlist-dialog.tsx
│   │   ├── edit-item-dialog.tsx
│   │   ├── history-dialog.tsx
│   │   ├── item-details-dialog.tsx
│   │   ├── purchase-confirmation-dialog.tsx
│   │   ├── settings-dialog.tsx
│   │   ├── unpurchase-confirmation-dialog.tsx
│   │   ├── update-budget-dialog.tsx
│   │   ├── wishlist-client-wrapper.tsx
│   │   ├── wishlist-items-section.tsx
│   │   └── ui/                     # shadcn/ui components
│   │       ├── button.tsx
│   │       ├── card.tsx
│   │       ├── dialog.tsx
│   │       ├── input.tsx
│   │       ├── label.tsx
│   │       └── table.tsx
│   └── lib/
│       ├── api-auth.ts             # API authentication helpers
│       ├── settings.ts             # Settings management
│       ├── slug.ts                 # URL slug generation
│       ├── utils.ts                # Utility functions
│       └── db/
│           ├── index.ts            # Database connection
│           └── schema.ts           # Drizzle ORM schema
├── data/                           # SQLite database location
│   └── sqlite.db                   # Database file (auto-created)
├── drizzle/                        # Database migrations
├── public/
│   └── icons/                      # Uploaded item icons
├── docker-compose.yml              # Docker Compose config
├── docker-compose.dev.yml          # Development Docker config
├── docker-compose.prod.yml         # Production Docker config
├── Dockerfile                      # Production Docker image
├── Dockerfile.dev                  # Development Docker image
├── drizzle.config.ts               # Drizzle ORM configuration
├── migrate.ts                      # Migration runner script
└── package.json
```

## 💾 Database

WishtoBudget uses SQLite with Drizzle ORM for a lightweight, serverless database solution.

### Database Schema

- **wishlists**: Stores wishlist information with names, descriptions, and budget limits
- **items**: Stores items with prices, priorities, purchase status, and custom icons
- **history**: Complete activity log of all changes and actions
- **settings**: Application settings like currency and API configuration

### Database Management

```bash
# Generate new migrations after schema changes
npm run db:generate

# Apply migrations to database
npm run db:migrate

# Push schema changes directly (development only)
npm run db:push

# Open Drizzle Studio (database GUI)
npm run db:studio
```

The database file is stored at `./data/sqlite.db` and is automatically created on first run.

## 🔧 Development Scripts

```bash
npm run dev          # Start development server with hot reload
npm run build        # Build optimized production bundle
npm run start        # Start production server
npm run lint         # Run ESLint code linting

# Database commands
npm run db:generate  # Generate migrations from schema changes
npm run db:migrate   # Apply pending migrations to database
npm run db:push      # Push schema changes directly (dev only)
npm run db:studio    # Open Drizzle Studio (visual database browser)
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Icons by [Lucide](https://lucide.dev/)
- Database by [Drizzle ORM](https://orm.drizzle.team/)

## 📧 Support

If you encounter any issues or have questions:
- Open an issue on [GitHub](https://github.com/itzpere/budget-wishlist/issues)
- Check the [DOCKER.md](DOCKER.md) for Docker-specific questions

---

Made with ❤️ for better budget management
