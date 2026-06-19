# QA Sprint 1 Checklist

- [ ] Auth: register, login, logout, protected routes
- [ ] Admin: bootstrap via Swagger, dashboard, stats
- [ ] Templates: seed, admin CRUD, user gallery
- [ ] CVs: create, edit, duplicate, delete, free plan limit (3)
- [ ] Export: GET /cvs/:id/export/html returns HTML
- [ ] Parser: POST /cvs/import with raw text
- [ ] Job match: POST /cvs/:id/jobs/match returns score

Run backend tests:
```bash
cd backend && npm run build
curl http://localhost:3002/api/health
```

Run frontend build:
```bash
cd frontend && npm run build
```
