# MOVONHUB Content Editing Guide

Audience: Super Admin (non-technical). This guide explains how to change the
text and legal notices on the public website without touching code.

Open the editor at:

```
https://movonhub.com.my/admin/content
```

Sign in at `/login` with the administrator username `admin` and the admin
password first. Only Super Admin can open the content editor.

No screenshots are included because none are available. The steps below describe
the on-screen labels.

## 1. What you can edit

The editor has three areas, chosen from the "What are you editing?" menu:

| Area | Applies to |
| --- | --- |
| Main website | The coming soon home page and its footer and SEO. |
| SA pages (all advisors) | The default wording for every advisor microsite. |
| One advisor only | Wording for a single advisor. This overrides the SA defaults. |

The main website and the SA pages each have their own list of fields. Every
field exists in English and Bahasa Melayu.

## 2. Editing the main website

1. Open `/admin/content`.
2. In "What are you editing?", choose "Main website".
3. Click Open.
4. Use the English and Bahasa Melayu tabs to fill in each field.
5. Check the "Live preview" panel on the right.
6. Choose Publish to make the text live, or Save draft to keep working without
   publishing.

Editable main website fields:

- Eyebrow text
- Main headline
- Supporting paragraph
- Status label
- Primary button text
- Contact button text
- Footer text
- Disclaimer
- SEO title
- SEO description

## 3. Editing SA page wording

There are two levels.

### 3.1 Default wording for all advisors

1. Choose "SA pages (all advisors)" and click Open.
2. Edit the fields and publish. Every advisor without a personal override uses
   this wording.

### 3.2 A single advisor

1. Choose "One advisor only".
2. Select the advisor from the "Choose a sales advisor" menu.
3. Click Open.
4. Edit and publish. This overrides the default only for that advisor.

Editable SA fields:

- Hero headline
- Hero introduction
- WhatsApp call to action
- Product section title
- Product section description
- Why choose Movon section title
- Final call to action headline
- Final call to action description
- Final call to action button
- Footer note
- Disclaimer
- SEO title
- SEO description

The fields "Hero introduction", "WhatsApp call to action", "Final call to action
button", "Disclaimer", "SEO title" and "SEO description" accept the placeholder
`{name}`. It is replaced with the advisor's display name.

## 4. Switching between English and Bahasa Melayu

Use the `English | Bahasa Melayu` tabs at the top of the editor. Each language is
edited separately. If a Bahasa Melayu field is empty, the site shows the built-in
default Bahasa Melayu wording (or the English default if none exists). It never
shows a blank space to a visitor.

## 5. Preview, save, publish and revert

- Live preview: the panel on the right always shows the wording that will be
  used for the selected language, including default fallbacks.
- Save draft: stores your text but keeps it hidden from the public.
- Publish: makes the currently shown area live.
- Revert to default: removes your overrides for that area and restores the
  built-in wording. Ask before using this on a live page.
- Unsaved changes: if you try to leave with unpublished edits, the browser warns
  you.

Saving or publishing applies to both languages at once, so fill in both tabs
before you publish.

## 6. Which fields affect search engines (SEO)

The fields marked with a small "SEO" badge:

- SEO title (shown as the browser and search result title)
- SEO description (shown under the title in search results)

Keep the SEO title under about 60 characters and the description under about 160
characters for best results.

## 7. Global versus advisor specific

- Main website fields are global.
- SA pages (all advisors) fields are global defaults for every SA page.
- One advisor only fields apply to a single advisor and override the defaults.

Priority order for any SA field: the advisor's own wording, then the SA default,
then the built-in wording.

## 8. Disclaimers and legal notices

The footer disclaimer text is editable through the "Disclaimer" fields described
above. The full legal pages (`/disclaimer`, `/privacy`, `/terms`) contain draft
wording and placeholders such as `[Business or entity name to be confirmed]`.

Rules:

- Do not invent a company name, registration number, registered address or
  privacy contact.
- Do not claim the text has been approved by Movon or by lawyers.
- All legal drafts must be reviewed by Malaysian legal counsel before launch.
- Do not state that MOVONHUB is the official Movon website.
- Do not use the em dash character in any new or edited copy. Use full stops,
  commas, colons or normal hyphens.

Malaysian English and professional Bahasa Melayu are used. Avoid the word "anda"
in Malay copy. Prefer neutral phrasing or "pelanggan" where appropriate.

## 9. Common tasks

| Task | Steps |
| --- | --- |
| Change the home page headline | Main website, edit Main headline, Publish. |
| Change the default SA headline for all advisors | SA pages (all advisors), edit Hero headline, Publish. |
| Give one advisor a different headline | One advisor only, select the advisor, edit Hero headline, Publish. |
| Restore the original wording | Open the area, click Revert to default. |
| Fix the disclaimer | Edit the relevant Disclaimer field, Publish, then ask counsel to review. |

## 10. If something looks wrong

- Draft text not visible: this is expected. Click Publish.
- A field is blank on the site: the default is being used. Check that Bahasa
  Melayu is filled in if you published only English.
- Change not appearing: hard refresh the page. Content is served dynamically.
- Cannot open `/admin/content`: confirm you are signed in as `admin`.
