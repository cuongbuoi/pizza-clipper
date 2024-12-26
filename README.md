# Pizza Clipper

#### A powerful extension to help users easily export data from web pages into CSV files. Allows users to select specific elements on a web page, configure export settings, and generate CSV files with the extracted data

## Overview

**Description:**  
Pizza Clipper is a powerful Chrome extension designed to help users easily export data from web pages into CSV files.
This extension allows users to select specific elements on a web page, configure export settings, and generate CSV files
with the extracted data. It is particularly useful for web scraping, data analysis, and automating data collection
tasks.

**Key Features:**

- **Element Selection:** Users can select container elements and child elements on a web page to specify the data to be
  exported.
- **Customizable Export Settings:** Users can define field names, data types (text content or HTML), and whether to
  repeat the selection for multiple elements.
- **CSV Export:** The extension generates CSV files from the selected data, making it easy to import into spreadsheets
  or other data analysis tools.
- **User-Friendly Interface:** The extension provides a simple and intuitive interface for configuring export settings
  and managing selected elements.
- **Clipboard Integration:** Selected query selectors can be copied to the clipboard for easy reuse.
- **Automation:** Users can automate the data export process by configuring and running predefined automation commands.
- **Highlight:** Users can highlight specific elements on a web page for better visibility and data extraction.

**How to Use:**

- **Install the Extension:** Add the Pizza Clipper extension to your Chrome browser from the Chrome Web Store.
- **Activate Export Mode:** Click on the extension icon to open the export configuration popup.
- **Select Elements:** Use the provided interface to select container and child elements on the web page.
- **Configure Settings:** Define field names, data types, and other export settings.
- **Export Data:** Click the "Export .CSV" button to generate and download the CSV file with the extracted data.
- **Run Automation:** Click the "Run automation" button to execute predefined automation commands.
- **Highlight Elements:** Click the "Highlight" button to highlight specific elements on the web page.

## Setup and Run Project

### Prerequisites

- Node.js (v18 or higher)
- Yarn package manager

### Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd pizza-clipper
   ```

2. **Install dependencies:**
   ```bash
   yarn install
   ```

### Development

1. **Start the development server:**
   ```bash
   yarn dev
   ```

2. **Start the development server for Firefox:**
   ```bash
   yarn dev:firefox
   ```

### Build

1. **Build the project for production:**
   ```bash
   yarn build
   ```

2. **Build the project for Firefox:**
   ```bash
   yarn build:firefox
   ```

### Packaging

1. **Create a zip file for Chrome Web Store:**
   ```bash
   yarn zip
   ```

2. **Create a zip file for Firefox Add-ons:**
   ```bash
   yarn zip:firefox
   ```

### Linting and Type Checking

1. **Run ESLint:**
   ```bash
   yarn lint
   ```

2. **Run TypeScript compiler:**
   ```bash
   yarn compile
   ```
