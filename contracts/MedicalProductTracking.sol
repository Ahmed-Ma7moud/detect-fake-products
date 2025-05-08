//time stamp as string to avoid bigint issue

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract MedicalProductTracking {
    address public contractOwner;

    constructor() {
        contractOwner = msg.sender;
    }

    modifier onlyContractOwner() {
        require(
            contractOwner == msg.sender,
            "Only the contract owner can perform this action"
        );
        _;
    }

    struct ProductDetails {
        address manufacturer;
        string serialNumber;
        string batchNumber;
        string productName;
        string location;
        string timestamp;
    }

    struct ProductStatus {
        address currentOwner;
        string currentLocation;
        string timestamp;
    }

    // Mapping from product serial number to product details
    mapping(string => ProductDetails) public productRegistry;

    // Mapping from product serial number to array of product history to track the path of each product
    mapping(string => ProductStatus[]) public productHistory;

    // Events
    event ProductRegistered(
        address manufacturerAddress,
        string manufacturerLocation,
        string productSerialNumber,
        string productBatchNumber,
        string productName,
        string registrationTimestamp
    );
    event ProductTransferred(
        address from,
        address to,
        string productSerialNumber,
        string transferTimestamp
    );

    function registerProduct(
        address manufacturerAddress,
        string calldata manufacturerLocation,
        string calldata productSerialNumber,
        string calldata productBatchNumber,
        string calldata productName
    ) public onlyContractOwner returns (bool) {
        if (manufacturerAddress == address(0)) {
            revert("Invalid manufacturer address");
        }

        if (bytes(manufacturerLocation).length == 0) {
            revert("Invalid Manufacturer location");
        }

        if (bytes(productSerialNumber).length == 0) {
            revert("Invalid Product serial number");
        }

        if (bytes(productBatchNumber).length == 0) {
            revert("Invalid Product batch number");
        }

        if (bytes(productName).length == 0) {
            revert("Invalid Product name");
        }

        if (bytes(productRegistry[productSerialNumber].timestamp).length != 0) {
            revert("duplicate SerialNumber");
        }

        string memory currentTimestamp = uint256ToString(block.timestamp);

        productRegistry[productSerialNumber] = ProductDetails({
            manufacturer: manufacturerAddress,
            location: manufacturerLocation,
            serialNumber: productSerialNumber,
            batchNumber: productBatchNumber,
            productName: productName,
            timestamp: currentTimestamp
        });

        productHistory[productSerialNumber].push(
            ProductStatus({
                currentOwner: manufacturerAddress,
                currentLocation: manufacturerLocation,
                timestamp: currentTimestamp
            })
        );
        emit ProductRegistered(
            manufacturerAddress,
            manufacturerLocation,
            productSerialNumber,
            productBatchNumber,
            productName,
            currentTimestamp
        );
        return true;
    }

    function transferOwnership(
        address previousOwnerAddress,
        address newOwnerAddress,
        string calldata newLocation,
        string calldata productSerialNumber
    ) public onlyContractOwner {
        //check input validation
        if (previousOwnerAddress == address(0)) {
            revert("Invalid previous owner address");
        }

        if (newOwnerAddress == address(0)) {
            revert("Invalid new owner address");
        }

        if (bytes(newLocation).length == 0) {
            revert("New location");
        }

        if (bytes(productSerialNumber).length == 0) {
            revert("Product serial number");
        }

        if (productHistory[productSerialNumber].length == 0) {
            revert("Invalid serial number");
        }

        uint len = productHistory[productSerialNumber].length;
        ProductStatus memory product = productHistory[productSerialNumber][
            len - 1
        ];

        if (previousOwnerAddress != product.currentOwner) {
            revert("Previous owner does not own this product");
        }

        if (newOwnerAddress == previousOwnerAddress) {
            revert("Cannot transfer ownership to the same address");
        }

        string memory currentTimestamp = uint256ToString(block.timestamp);

        //push current status of the product in product history
        product.currentOwner = newOwnerAddress;
        product.currentLocation = newLocation;
        product.timestamp = currentTimestamp;
        productHistory[productSerialNumber].push(product);
        emit ProductTransferred(
            previousOwnerAddress,
            newOwnerAddress,
            productSerialNumber,
            currentTimestamp
        );
    }

    function getProductHistory(
        string calldata productSerialNumber
    ) public view returns (ProductStatus[] memory) {
        require(
            bytes(productSerialNumber).length > 0,
            "serial number can not be empty"
        );
        require(
            productHistory[productSerialNumber].length > 0,
            "invalid serial number"
        );
        return productHistory[productSerialNumber];
    }

    //return current owner and location of the product
    function getProduct(
        string calldata productSerialNumber
    ) public view returns (ProductStatus memory) {
        require(
            bytes(productSerialNumber).length > 0,
            "serial number can not be empty"
        );
        uint len = productHistory[productSerialNumber].length;
        require(len > 0, "invalid serial number");
        return productHistory[productSerialNumber][len - 1];
    }

    function checkProduct(
        string calldata productSerialNumber,
        address currentOwnerAddress,
        string calldata clientLocation
    ) public view returns (bool) {
        require(
            bytes(productSerialNumber).length > 0,
            "serial number can not be empty"
        );
        uint len = productHistory[productSerialNumber].length;
        if (len == 0) return false;
        ProductStatus memory product = productHistory[productSerialNumber][
            len - 1
        ];
        if (currentOwnerAddress != product.currentOwner) return false;
        if (
            keccak256(bytes(clientLocation)) !=
            keccak256(bytes(product.currentLocation))
        ) return false;
        return true;
    }

    // Helper function to convert uint256 to string
    function uint256ToString(
        uint256 value
    ) internal pure returns (string memory) {
        if (value == 0) {
            return "0";
        }

        uint256 temp = value;
        uint256 digits;

        while (temp != 0) {
            digits++;
            temp /= 10;
        }

        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }

        return string(buffer);
    }
}
