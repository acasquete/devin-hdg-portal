# Document Intelligence Service

A professional web application interface inspired by Microsoft 365 for Document Intelligence Service with multiple modules including Hidden Dangerous Goods (HDG) and Customs Portal. The system extracts structured information from documents and integrates human-in-the-loop (HITL) review capabilities.

## 🚀 Quick Start

### Prerequisites
- **Node.js** (v18 or higher) with npm
- **Python** (3.12 or higher) 
- **Poetry** (for Python dependency management)

### One-Command Setup & Start
```bash
# Clone the repository
git clone https://github.com/acasquete/devin-hdg-portal.git
cd devin-hdg-portal

# Install all dependencies (frontend + backend)
npm run install:all

# Start both frontend and backend services
npm run dev
```

The application will be available at:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000

## 📋 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start both frontend and backend services concurrently |
| `npm run dev:frontend` | Start only the frontend development server |
| `npm run dev:backend` | Start only the backend API server |
| `npm run install:all` | Install dependencies for both frontend and backend |
| `npm run build` | Build the frontend for production |
| `npm run lint` | Run ESLint on the frontend code |
| `npm run clean` | Clean all node_modules and build artifacts |

## 🏗️ Project Structure

```
devin-hdg-portal/
├── document-intelligence-frontend/    # React + TypeScript + Vite frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/               # Header, Sidebar, MainContent
│   │   │   ├── modules/              # Dashboard, Ingestion, etc.
│   │   │   └── ui/                   # shadcn/ui components
│   │   └── App.tsx
│   ├── package.json
│   └── ...
├── document-intelligence-backend/     # FastAPI backend
│   ├── app/
│   │   └── main.py
│   ├── pyproject.toml
│   └── ...
├── package.json                      # Root package for concurrent scripts
└── README.md
```

## 🎯 Features

### Global Navigation & Layout
- **Module Selector**: Switch between HDG and Customs Portal modules
- **Role-based Access**: Users only see modules they're permitted to access
- **Responsive Design**: Clean, professional UI with light/dark mode support
- **Microsoft 365 Inspired**: Professional interface with light red accent color

### Core Modules
Each module includes a sidebar with these sections:
- **Dashboard**: Key metrics and visualizations
- **Ingestion**: Manual upload and Kafka-based document ingestion
- **Processed Documents**: View and analyze extracted document information
- **Schema Configuration**: Build and manage extraction schemas
- **Users**: User management with role-based access control
- **Analytics**: File analytics, hazard analytics, and operational KPIs
- **Configuration**: System settings and model configuration
- **Audit**: Central log of all system activities

### User Management
- **Roles**: Admin, Analyst, Viewer, DG-certified reviewer
- **Module Access**: Each user can have multiple module assignments
- **Audit Trail**: All user changes are logged for compliance

### Document Processing
- **Multi-format Support**: PDF, PNG, JPG, TIFF files
- **Hazard Detection**: Automatic identification of dangerous goods
- **Human-in-the-Loop**: Manual review workflow for critical decisions
- **Confidence Scoring**: AI confidence levels for all extractions

## 🛠️ Development Setup (Manual)

If you prefer to set up services individually:

### Frontend Setup
```bash
cd document-intelligence-frontend
npm install
npm run dev
```

### Backend Setup
```bash
cd document-intelligence-backend
poetry install
poetry run fastapi dev app/main.py
```

## 🔧 Technology Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **shadcn/ui** for UI components
- **Lucide React** for icons
- **Recharts** for data visualization
- **Next Themes** for dark/light mode

### Backend
- **FastAPI** for high-performance API
- **Poetry** for dependency management
- **Python 3.12+**

## 🎨 Design System

- **Inspired by Microsoft 365**: Clean, professional interface
- **Accent Color**: Light red tone matching Expeditors logo
- **Typography**: Clear hierarchy with consistent spacing
- **Components**: Reusable UI components with consistent styling
- **Accessibility**: WCAG AA compliant design

## 🚦 Getting Started Guide

1. **Clone and Install**:
   ```bash
   git clone https://github.com/acasquete/devin-hdg-portal.git
   cd devin-hdg-portal
   npm run install:all
   ```

2. **Start Development**:
   ```bash
   npm run dev
   ```

3. **Access the Application**:
   - Open http://localhost:5173 in your browser
   - Use the module selector to switch between HDG and Customs Portal
   - Explore the different modules using the sidebar navigation

4. **Test Features**:
   - Upload documents in the Ingestion module
   - View processed documents with hazard detection
   - Configure extraction schemas
   - Review analytics and audit trails

## 🆘 Troubleshooting

### Common Issues

**Port Already in Use**:
```bash
# Kill processes on ports 5173 or 8000
lsof -ti:5173 | xargs kill -9
lsof -ti:8000 | xargs kill -9
```

**Dependencies Issues**:
```bash
# Clean and reinstall
npm run clean
npm run install:all
```

**Frontend Not Loading**:
- Ensure Node.js v18+ is installed
- Check that port 5173 isn't blocked by firewall
- Try deleting `node_modules` and running `npm install`

**Backend Not Starting**:
- Ensure Python 3.12+ is installed
- Verify Poetry is installed: `poetry --version`
- Check backend logs for specific error messages

## 📝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Make your changes and test thoroughly
4. Commit your changes: `git commit -m "Add your feature"`
5. Push to the branch: `git push origin feature/your-feature`
6. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🔗 Links

- **Repository**: https://github.com/acasquete/devin-hdg-portal
- **Issues**: https://github.com/acasquete/devin-hdg-portal/issues
- **Documentation**: Coming soon

---

Built with ❤️ using React, FastAPI, and modern web technologies.
