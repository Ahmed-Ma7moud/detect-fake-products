# MediShield: Blockchain-based Medical Product Tracking

## Project Overview
MediShield is a full-stack system designed to track and detect fake medical products using blockchain technology. By leveraging smart contracts and decentralized ledgers, this project ensures the authenticity, traceability, and transparency of medical products as they move from manufacturers to patients. The system helps prevent counterfeit products from entering the supply chain, protecting both businesses and consumers.

## System Explanation
- **Blockchain Layer:** Smart contracts (written in Solidity) deployed on Ethereum record every transaction and transfer of product ownership, making the history immutable and verifiable.
- **Backend API:** Node.js/Express.js server interacts with the blockchain and a MongoDB database, providing RESTful endpoints for manufacturers, suppliers, pharmacies, and patients.
- **User Roles:**
  - **Manufacturer:** Creates product batches, initiates contracts, and tracks product distribution.
  - **Supplier:** Receives batches, manages contracts, and supplies products to pharmacies.
  - **Pharmacy:** Buys products from suppliers and sells to patients.
  - **Patient:** Verifies product authenticity and history.
- **Frontend:** Can be built to interact with the backend API for a complete user experience.

## Installation & Setup

### 1. Prerequisites
- **Node.js** 
- **npm** (comes with Node.js)
- **MongoDB** (local or cloud instance)
- **Git**
- **Solidity** (for smart contract development)
- **Truffle** (for compiling/deploying smart contracts)
- **Ganache** (for local Ethereum blockchain testing)

### 2. Install Blockchain Tools
- **Solidity:**
  - Install via [Solidity documentation](https://docs.soliditylang.org/en/v0.8.21/installing-solidity.html)
- **Truffle:**
  ```sh
  npm install -g truffle
  ```
- **Ganache:**
  - Download from [https://trufflesuite.com/ganache/](https://trufflesuite.com/ganache/)
  - Or install CLI:
    ```sh
    npm install -g ganache
    ```

### 3. Clone the Repository
```sh
git clone <your-repo-url>
cd MediShield final
```

### 4. Install Backend Dependencies
```sh
npm install
```

### 5. Configure Environment
- Copy `.env.example` to `.env` and fill in your MongoDB URI, JWT secret, and other config values as needed.

### 6. Compile & Deploy Smart Contracts
```sh
truffle compile
truffle migrate --network development
```
- Make sure Ganache is running for local development.

### 7. Start the Backend Server
```sh
npm run dev
# or
npm start
```

## API Overview
- RESTful endpoints for authentication, product, batch, contract, and order management.
- See the `controllers/` and `routes/` folders for detailed API logic and endpoints.

## Key Features
- Immutable product tracking on blockchain
- Role-based access (manufacturer, supplier, pharmacy, patient)
- Product authenticity verification
- Secure authentication (JWT, Google OAuth, 2FA)
- Rate limiting and security best practices

## Tech Stack
- **Smart Contracts:** Solidity, Truffle, Ganache
- **Backend:** Node.js, Express.js, MongoDB, Web3.js
- **Security:** JWT, OAuth, 2FA, Helmet, Rate Limiting

---


## [Live Frontend Demo](https://graduate-project-nine.vercel.app/)

Try the MediShield website frontend (connected to this backend).

---

For more details, see the codebase and comments. Contributions and suggestions are welcome!
