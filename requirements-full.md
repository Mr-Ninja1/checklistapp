# BRAVO Restaurant Cleaning Checklist App Requirements

## Overview
A cross-platform React Native mobile app for BRAVO restaurant supervisors to manage cleaning checklists for food contact surfaces, utensils, and other items. The app will generate forms grouped by categories, allowing supervisors to check, save, and switch between categories. All checked forms will be saved as PDFs, with offline access and automatic sync to Google Drive or Dropbox.

## Key Features
- Cross-platform (Android & iOS) using React Native
- Supervisor login (simple authentication)
- Splash screen and modern UI with gradients
- Hamburger menu with Home and Logout
- Categories (e.g., Kitchen, Utensils, Food, Staff Hygiene, Equipment)
- Only forms for the selected category are shown
- Each category contains modern cards for each form subject, with status (Pending/Done)
- Save progress and switch between categories
- Print and save checked forms as PDFs
- Local storage for offline access
- Automatic sync to Google Drive/Dropbox when online
- History page to review checked forms by session/date
- Ability to view, print, or share old PDFs

## Data & Sync
- Forms are stored as PDFs locally
- When internet is available, PDFs are synced to Google Drive/Dropbox
- App handles authentication for cloud storage
- History is organized by session/date for easy review

## User Roles
- Supervisor (initially; more roles can be added later)

## Next Steps

## Future Feature: PDF Storage, Offline History, and Cloud Sync
- All completed forms are saved as A4-sized PDFs, capturing the entire form (not just the visible viewport)
- PDFs are stored locally on the device for offline access
- A History page displays all saved PDFs, organized by session/date
- When internet is available, unsynced PDFs are automatically uploaded to Google Drive or Dropbox
- The app handles authentication for cloud storage and marks forms as synced
- Users can view, print, or share any saved PDF from the history page
- Await client confirmation on categories and forms
- Add required fields for each form as provided
- Implement PDF generation, print, and sync features
- Build history page for session/date review

## Open Questions
- Exact categories and forms needed (awaiting client)
- Fields required for each form
- Preferred cloud storage (Google Drive, Dropbox, or both)
- Any additional user roles or permissions

---
*This document can be pasted to restore full requirements context for future development.*
