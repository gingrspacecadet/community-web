# Welcome to the bigstone community web!

### We like people to contribute stuff

**Local start up**:
`wrangler pages dev public`

**Local DB set up (only run once)**:
`wrangler d1 execute community-web --local --file=sql/local.sql`

*Franken UI import*:
`<script src="/public/javascript/ui/franken.js" type="module"></script>`

Functions right now:

- [ ] Main page
- [ ] Wiki
- [x] Authentication
  - [x] Basic Auth
  - [x] Discord Auth
- [ ] Admin roles
