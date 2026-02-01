
<img width="1122" height="480" alt="repository-open-graph-template" src="https://github.com/user-attachments/assets/af1cae80-2a7f-4809-8b65-16585a3f2899" />

# WishtoBudget

A self-hosted wishlist and budget management tool that helps you answer "Can I afford this?" at a glance. Organize purchases across multiple wishlists, set spending limits, and visualize affordability with battery-style indicators that show which items fit your budget.

**For privacy-conscious individuals** who want control over their financial data while managing personal purchases, savings goals, and wish lists across different categories (tech, home, gifts, etc.).

**What makes it different:** Interactive purchase simulation mode lets you select items and see real-time budget impact before committing, plus unique battery visualization that instantly shows whether items are affordable.

## 🎯 Key Features

- **Multiple Wishlists with Budgets** - Create unlimited wishlists (Tech, Home, Gifts, etc.) each with individual budget limits and track combined total budget
- **Battery-Style Visual Tracking** - Items display as "battery" cards showing charge level based on available budget (green when affordable, red when over budget)
- **Purchase Simulation Mode** - Interactive "what-if" mode to select items and see real-time budget impact before committing to purchases
- **Flexible Pricing** - Support for fixed prices or price ranges (min/max) with additional costs (shipping, taxes) and configurable simulation modes
- **Complete Activity History** - Full audit trail of budget changes, item additions, purchases, and updates with timestamps
- **Custom Item Icons** - Upload custom images or provide URLs for items with automatic local caching
- **Database Import/Export** - Full backup and restore functionality via JSON export for data portability

## 🚀 Quick Start

### Docker (Recommended)

```bash
docker compose up -d
```

Application available at [http://localhost:3000](http://localhost:3000). Data persists in Docker volumes (`budget-data` and `budget-icons`).

**View logs:** `docker compose logs -f wishtobudget`  
**Stop:** `docker compose down`

### Local Development

```bash
# Clone and install
git clone https://github.com/itzpere/budget-wishlist.git
cd wishtobudget
npm install

# Start (database auto-created on first run)
npm run dev
```

Navigate to [http://localhost:3000](http://localhost:3000)

## 💡 Usage

### Create a Wishlist
1. Click **"Add Wishlist"** → Enter name and budget → Click **"Add Wishlist"**

### Add Items
1. Click **"Add Item"** → Select wishlist → Enter name, price, and priority (1-5) → Optionally upload icon → Click **"Add Item"**

### Simulate Purchases
1. Navigate to a wishlist → Enable simulation mode → Select items to "test buy" → See real-time budget impact → Commit or cancel

### Track Purchases
1. Click on any item → Click **"Mark as Purchased"** → Item marked and budget updated → Use **"Undo Purchase"** to revert if needed

### Settings & History
- **Settings**: Change currency symbol, enable API access with secret key
- **History**: View complete activity log with all budget changes, additions, and purchases

## 🛠️ Tech Stack

- **Framework**: Next.js 16 with App Router and Server Actions
- **Database**: SQLite with Drizzle ORM for type-safe queries
- **UI Components**: shadcn/ui (Radix UI primitives)
- **Styling**: Tailwind CSS 4 with custom animations
- **Icons**: Lucide React
- **Image Processing**: Sharp for optimized image handling
- **TypeScript**: Full type safety throughout the application

---

## 🔌 API Integration (Optional)

WishtoBudget includes an optional REST API for automation. Enable in Settings and set an API secret key.

### API Endpoints

All requests require `x-api-secret` header.

**Get All Data**
```bash
GET /api/data
```

**Get History**
```bash
GET /api/history
```

**Upload Item Icon**
```bash
POST /api/upload-icon
Content-Type: multipart/form-data
Body: file (image file)
```

**Save Item Icon**
```bash
POST /api/save-icon
Content-Type: application/json
Body: { "itemId": 123, "imageUrl": "/icons/image.png" }
```

**Example:**
```bash
curl -H "x-api-secret: your-secret-key" http://localhost:3000/api/data
```

---

## 💾 Database Management

SQLite database at `./data/sqlite.db` (auto-created). Drizzle ORM schema with wishlists, items, history, and settings tables.

```bash
npm run db:generate  # Generate migrations from schema changes
npm run db:migrate   # Apply migrations to database
npm run db:push      # Push schema changes directly (dev only)
npm run db:studio    # Open Drizzle Studio (visual database browser)
```

---

## 🔧 Development Scripts

```bash
npm run dev          # Start development server
npm run build        # Build production bundle
npm run start        # Start production server
npm run lint         # Run ESLint
```

---

## 📁 Project Structure

```
src/
├── app/
│   ├── actions.ts              # Server Actions
│   ├── page.tsx                # Main dashboard
│   ├── api/                    # API routes
│   └── wishlist/[id]/          # Wishlist detail pages
├── components/                 # React components
│   └── ui/                     # shadcn/ui components
└── lib/
    ├── db/
    │   ├── index.ts            # Database connection
    │   └── schema.ts           # Drizzle schema
    ├── api-auth.ts             # API authentication
    ├── settings.ts             # Settings management
    └── utils.ts
```

---

## 🤝 Contributing

Contributions welcome! Open an issue for major changes before submitting PRs.

## 📝 License

MIT License - see LICENSE file for details.

## 🙏 Acknowledgments

Built with [Next.js](https://nextjs.org/), [shadcn/ui](https://ui.shadcn.com/), [Lucide](https://lucide.dev/), and [Drizzle ORM](https://orm.drizzle.team/).

---

Made with ❤️ for better budget management
