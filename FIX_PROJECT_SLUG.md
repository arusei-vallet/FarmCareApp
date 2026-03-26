# Fix Project Slug Mismatch

## Problem

```
Project config: Slug for project identified by "extra.eas.projectId" (farmcare-expo) 
does not match the "slug" field (farmcare).
```

The current project ID `f180a8fc-f1a6-4594-961d-14aa8bca6b10` belongs to a project with slug `farmcare-expo`, but your config uses slug `farmcare`.

---

## Solution Options

### Option 1: Create New Project with Slug "farmcare" (Recommended)

This creates a fresh project with the correct slug.

**Steps:**

1. **Remove old project ID:**
   ```bash
   cd c:\Users\User\farmcare-expo
   ```
   
   Edit `app.json` and remove the `projectId`:
   ```json
   "extra": {
     "eas": {}
   }
   ```

2. **Create new project:**
   ```bash
   npx eas init
   ```
   - When prompted for slug, enter: `farmcare`
   - This will create a new project and update `app.json` with new projectId

3. **Update Supabase secrets** (if needed):
   The new project will have different URLs, update if needed.

4. **Commit changes:**
   ```bash
   git add -A
   git commit -m "feat: create new EAS project with slug 'farmcare'"
   git push origin main
   ```

---

### Option 2: Change Slug to Match Existing Project

If you want to keep the current project ID, change the slug to match.

**Steps:**

1. **Edit `app.json` and `app.config.js`:**
   ```json
   {
     "expo": {
       "slug": "farmcare-expo",
       "owner": "farmcare-expo"
     }
   }
   ```

2. **Commit:**
   ```bash
   git add -A
   git commit -m "fix: update slug to match existing project"
   git push origin main
   ```

**Downside:** App will be published as "farmcare-expo" instead of "farmcare"

---

## Recommended: Option 1

**Run these commands:**

```bash
cd c:\Users\User\farmcare-expo
```

Then manually edit `app.json` to remove projectId, then run:
```bash
npx eas init
```

Enter `farmcare` when prompted for slug.

---

## Quick Fix Script

Run this to prepare for Option 1:

```bash
# We'll update app.json to remove projectId
# Then you run: npx eas init
```

The script will:
1. Remove old projectId
2. Clear cache
3. Prompt you to run `npx eas init`

---

**After creating new project:**
- New projectId will be generated
- Updates URL will change
- Rebuild app: `npx eas build --platform android`
