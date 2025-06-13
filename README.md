# LearningApp - Democratizing Education Through Community

**A centralized platform that organizes and curates free online resources into a structured, community-driven learning ecosystem.**

---

## 🎯 Core Mission

This project aspires to democratize education by creating a global, free learning platform where anyone can dive into any subject and instantly see the clearest path to mastery. Our platform pulls together the best online resources—videos, articles, courses—and organizes them into community-curated roadmaps that show you what to learn first, what's next, and where to find the best materials.

### Elevator Pitch

Imagine having access to a structured learning path for any subject, powered by community wisdom and enhanced by AI. Whether you're learning calculus, mastering programming, or exploring new skills, our platform makes it simple, structured, and social—empowering everyone, everywhere, to learn smarter.

**More & Better Education → Better Future**

---

## 🏗️ Platform Architecture

### Current Implementation

#### Left Sidebar - Navigation
- **Wiki Articles**: Browse structured learning content
- **Learning Resources**: Discover curated educational materials
- **My Lists**: Personal collections and bookmarks

#### Main Content Area
- **Wiki Article Pages**: Knowledge base linked to Wikipedia topics
- **Learning Resources**: Community-curated educational content
- **Interactive Learning Tools**: Integrated study aids

#### Right Sidebar - Learning Tools
- **Personal Notebook**: Note-taking and organization
- **Related Pages Graph**: Visual topic connections
- **Study Tools**: Pomodoro timer, flashcards, assessments

### Technology Stack

- **Backend**: Django + Wagtail CMS
- **Frontend**: Next.js + React
- **Database**: PostgreSQL
- **Infrastructure**: Docker + Nginx
- **Styling**: CSS Modules

---

## 🚀 Coming Soon Features

### AI-Enhanced Learning
- **Learning Companion**: Personalized study planning and guidance
- **Smart Content Generation**: AI-generated flashcards and assessments
- **Doubt Clarification**: Interactive Q&A assistance
- **Resource Discovery**: Intelligent content recommendations

### Advanced Community Features
- **Structured Discussions**: Q&A and debate systems
- **Community Articles**: User-generated learning paths
- **Collaborative Study Plans**: Community-built roadmaps
- **Peer Learning**: Study groups and mentorship matching

### Learning Analytics
- **Progress Tracking**: Visual learning journey maps
- **Mastery Assessment**: Self-evaluation and skill verification
- **Adaptive Learning Paths**: Personalized content sequencing
- **Performance Analytics**: Detailed learning insights

### Social Learning
- **Study Groups**: Collaborative learning spaces
- **Knowledge Sharing**: Community-driven content creation
- **Peer Reviews**: Resource quality assessment
- **Learning Competitions**: Gamified skill challenges

### Enhanced Tools
- **Advanced Notebook**: Notion-like editing with rich media
- **Interactive Flashcards**: Spaced repetition system
- **Mind Mapping**: Visual concept organization
- **Integrated Calendar**: Study scheduling and reminders

### Platform Expansion
- **Mobile Application**: Native iOS and Android apps
- **Offline Learning**: Download content for offline study
- **Multi-language Support**: Global accessibility
- **API Integration**: Third-party learning tool connections

### Educational Institution Support
- **University Pages**: Institutional learning resources
- **Course Integration**: Academic curriculum alignment
- **Student Communities**: Campus-specific discussion spaces
- **Credential Verification**: Achievement recognition system

---

## 🎯 The Problem We're Solving

### Overabundance of Resources
- **Information Overload**: Countless free resources exist, but finding the right learning path is overwhelming
- **Quality Uncertainty**: Difficulty identifying the most effective materials
- **Sequence Confusion**: Unclear learning order and prerequisites

### Inefficient Learning Paths
- **Scattered Resources**: Educational content spread across platforms
- **No Clear Roadmap**: Lack of structured progression from beginner to advanced
- **Isolated Learning**: Limited community guidance and support

---

## 🌟 Our Solution

### Community-Driven Curation
- **Collective Intelligence**: Harness community knowledge to identify best resources
- **Quality Voting**: Democratic system for resource evaluation
- **Collaborative Organization**: Community-built learning sequences

### Structured Learning Paths
- **Clear Prerequisites**: Visual dependency mapping between topics
- **Progressive Difficulty**: Organized content from basic to advanced
- **Multiple Perspectives**: Various learning approaches for different styles

### Free and Accessible
- **Global Access**: Available worldwide at no cost
- **Language Support**: Multi-language content and interface
- **Open Knowledge**: Democratized access to quality education

---

## 🔧 Getting Started

### Prerequisites

- Python 3.11+
- Node.js 20 (using nvm)
- Docker & Docker Compose
- [mkcert](https://github.com/FiloSottile/mkcert) for SSL certificates

### Quick Setup

1. **Clone and setup environment**
   ```bash
   git clone [repository-url]
   cd LearningApp
   cp docker/config/python.example.env docker/config/python.env
   ```

2. **Configure local domain**
   ```bash
   echo "127.0.0.1 learningapp.online.test" >> /etc/hosts
   ```

3. **Set up HTTPS certificates**
   ```bash
   mkcert -install
   mkcert --cert-file docker/files/certs/cert.pem --key-file docker/files/certs/cert-key.pem learningapp.online.test
   ```

4. **Configure Nginx for SSL**
   ```bash
   ./scripts/enable_ssl.sh
   ```

5. **Start backend services**
   ```bash
   docker compose up -d
   ```

6. **Initialize database** (first time only)
   ```bash
   ./scripts/manage.sh migrate
   ./scripts/manage.sh createsuperuser
   ```

7. **Setup and start frontend**
   ```bash
   cd frontend
   nvm use
   npm install
   npm run dev
   ```

8. **Visit your site**
   - Frontend: [https://learningapp.online.test:8082](https://learningapp.online.test:8082)
   - Admin: [https://learningapp.online.test:8082/wt/cms](https://learningapp.online.test:8082/wt/cms) (admin/admin)

---

## 🤝 Contributing

We welcome contributions from the community! Whether you're:
- Adding learning resources
- Improving content organization
- Developing new features
- Translating content
- Providing feedback

Every contribution helps democratize education for everyone.

### Development Setup

1. Follow the setup instructions above
2. Create feature branches for new development
3. Run tests before submitting changes
4. Follow our coding standards and documentation guidelines

---

## 🌍 Vision

We envision a world where quality education is accessible to everyone, regardless of location, economic status, or background. Through community collaboration and technological innovation, we're building the foundation for a more educated and equitable future.

**Join us in democratizing education—one learner at a time.**

---

## 📚 Additional Resources

- [Frontend Developer Guide](docs/guides/frontend-developer-guide.md)
- [Backend Developer Guide](docs/guides/backend-developer-guide.md)
- [Getting Started Guide](docs/guides/getting-started-guide.md)
- [Scaffolding Components](docs/guides/scaffolding.md)

### Deployment & DevOps
- [Provisioning Servers](docs/guides/provisioning-servers-for-hosting.md)
- [CircleCI Deployment](docs/guides/setting-up-deployment-with-circleci.md)
- [Running Python Locally](docs/guides/running-python-locally.md)

### Advanced Features
- [Multi-language Support](docs/guides/adding-multi-language-support.md)
- [Wagtail 2FA Support](docs/guides/adding-wagtail-2fa-support.md)
- [Sentry Integration](docs/guides/adding-sentry.md)
- [CSRF Token Handling](docs/guides/handling-csrf-tokens.md)

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
