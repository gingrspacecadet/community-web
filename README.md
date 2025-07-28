# Welcome to the Bigstone Community Web

## Local Setup

### 1. Initialize Local Database *(one-time)*
```bash
wrangler d1 execute community-web --local --file=sql/local.sql
```

### 2. Start Local Development Server
```bash
wrangler pages dev public
```

---

## Development

### Franken UI

Add this script to your HTML's head tag to use the library. For components, make sure the [version is 2.0](https://dos.franken-ui.dev/docs/2.0/installation/). Another thing is if the import doesn't work, adjust the /public/ to a relative path: `../javascript/ui/franken.js`
```html
<script  src="/public/javascript/ui/franken.js" type="module"></script>
```

---

## 📂 Project Functions

- [x] **Main Page**
  - [x] Login button  
  - [ ] Links to Bigstone development projects

- [ ] **App Page**
	- [ ] as you clearly see our ideas end right about here.

