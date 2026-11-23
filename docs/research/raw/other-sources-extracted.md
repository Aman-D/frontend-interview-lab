# Titles extracted from other primary sources

All pages fetched 2026-11-23. Pages that require JavaScript were rendered in headless Chromium (Playwright) and their `innerText` was inspected. Only titles/short labels are recorded here — no prose was copied.

## Front End Interview Handbook — User interface coding
URL: https://www.frontendinterviewhandbook.com/coding/build-front-end-user-interfaces (HTTP 200, "Last updated on Oct 5, 2026")
The page's "Where to practice" list names these GreatFrontEnd questions:
- Components: Tabs, Modal Dialog, Image Carousel, Accordion, Star Rating, Progress Bars
- Widgets: Traffic Light, Digital Clock, Stopwatch, Transfer List
- Apps: Todo list, Data Table (with extensions for sorting and filtering), File Explorer, Kanban Board
- Games: Tic-tac-toe, Whack-a-mole, Wordle, Tetris (advanced), Snake (advanced)
The page also lists evaluation considerations (multiple instances, race conditions in network requests, empty states, virtual lists, a11y, XSS via innerHTML).

## Front End Interview Handbook — JavaScript coding
URL: https://www.frontendinterviewhandbook.com/coding/javascript-utility-function (HTTP 200)
- Basic examples: Array.prototype map/reduce/filter/sort; Promise, Promise.all, Promise.any; Lodash debounce(), throttle(), cloneDeep(), groupBy(); chunk()/map() with mapAsync follow-up; convert object keys to snake_case/camelCase; getElementsByClassName/getElementsByTagName; Observer pattern
- Advanced examples: templating engine; JSON.stringify(); table of contents from HTML page
- "Where to practice": Debounce, Promise.all, Flatten, Classnames, Deep Clone, Event Emitter, List Format, getElementsByClassName, Array.prototype.filter()
- Statement: basic questions take "around 10-15 minutes"; advanced "around 25-30 minutes" for senior candidates.

## Front End Interview Handbook — System design: UI components
URL: https://www.frontendinterviewhandbook.com/front-end-system-design/ui-components (HTTP 200)
- Examples: Autocomplete, Image carousel, Dropdown menu, Modal dialog, Rich text editor, Poll widget, Data table, Tooltip

## FrontendGeek — Machine Coding Round Interview
URL: https://www.frontendgeek.com/frontend-interview/machine-coding-interview (HTTP 200, title "Frontend Machine Coding Round Questions & Resources")
- Component machine coding: Infinite Scroll, Popover, Star Component, Tab bar, Auto Complete Search | Typeahead Search, Toast Notification, Progress Bar, Step Form, Accordion, Image Carousel, Modal Component, Menu bar - Responsive, Tree View / Folder View, Comment View (Multi-level), Pagination, Countdown Timer, Light & Dark Theme, Multi-Step Form, OTP Input Design, Chips Input
- Application machine coding: ToDo App, Email Inbox View, Games (Tic-tac-toe, Snake Ladder, Wordle, Sudoku), E-Commerce App View, Messaging Interface, Calendar View, Application Forms, Cinema Hall Seat Booking UI, Kanban Board

## allahabadi.dev (Frontend Master) — Component Design: 16 Frontend System Design Interview Questions
URL: https://allahabadi.dev/frontend-system-design/components/ (HTTP 200)
1 Autocomplete, 2 Image Carousel, 3 Modal / Dialog, 4 Dropdown Menu, 5 Data Table, 6 Date Picker, 7 Virtualized List, 8 Tooltip, 9 Tabs Component, 10 Accordion, 11 Embeddable Poll, 12 Rich Text Editor, 13 File Uploader, 14 Toast / Notification System, 15 Command Palette (Cmd-K), 16 Config-Driven UI
Note: framed as *system design* questions; used here as supporting evidence of interview relevance, not as machine-coding prompts.

## GreatFrontEnd — INACCESSIBLE
URLs attempted: /blog/machine-coding-round, /front-end-interview-playbook/javascript, /front-end-interview-playbook/user-interface, /questions/javascript, /questions/user-interface.
Result: HTTP 429 "Vercel Security Checkpoint — Failed to verify your browser (Code 21)" with both curl and headless Chromium (20 s wait). Contents were NOT read and are not described anywhere in this project. GreatFrontEnd question titles cited in this project come only from the Front End Interview Handbook pages above, which name them explicitly.
