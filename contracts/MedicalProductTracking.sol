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
        string tradeName;
        string role;
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
        string calldata productName,
        string calldata tradeName
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

        if (bytes(tradeName).length == 0) {
            revert("Invalid trade name");
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
                timestamp: currentTimestamp,
                tradeName: tradeName,
                role: "manufacturer"
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

    function getProductDetails(
        string calldata productSerialNumber
    ) public view returns (ProductDetails memory) {
        require(
            bytes(productSerialNumber).length > 0,
            "Serial number cannot be empty"
        );
        require(
            productRegistry[productSerialNumber].manufacturer != address(0),
            "Invalid serial number"
        );

        return productRegistry[productSerialNumber];
    }

    function transferOwnership(
        address newOwnerAddress,
        string calldata newLocation,
        string calldata productSerialNumber,
        string calldata tradeName,
        string calldata role
    ) public onlyContractOwner {
        //check input validation
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

        if (bytes(role).length == 0) {
            revert("Invalid trade name");
        }

        if (bytes(tradeName).length == 0) {
            revert("Invalid trade name");
        }

        uint len = productHistory[productSerialNumber].length;
        ProductStatus memory product = productHistory[productSerialNumber][len - 1];

        if (newOwnerAddress == product.currentOwner) {
            revert("Cannot transfer ownership to the same address");
        }

        string memory currentTimestamp = uint256ToString(block.timestamp);

        //push current status of the product in product history
        product.currentOwner = newOwnerAddress;
        product.currentLocation = newLocation;
        product.timestamp = currentTimestamp;
        product.role = role;
        product.tradeName = tradeName;
        productHistory[productSerialNumber].push(product);
        emit ProductTransferred(
            product.currentOwner,
            newOwnerAddress,
            productSerialNumber,
            currentTimestamp
        );
    }

    function getProductHistory(
        string calldata productSerialNumber
    ) public view returns (ProductStatus[] memory) {
        if (bytes(productSerialNumber).length == 0)
            revert("serial number can not be empty");
        if (productHistory[productSerialNumber].length == 0)
            revert("invalid serial number");

        return productHistory[productSerialNumber];
    }

    //return current owner and location of the product
    function getProduct(
        string calldata productSerialNumber
    ) public view returns (ProductStatus memory) {
        if (bytes(productSerialNumber).length == 0)
            revert("serial number can not be empty");
        uint len = productHistory[productSerialNumber].length;
        if (len == 0) revert("invalid serial number");
        return productHistory[productSerialNumber][len - 1];
    }

    function checkProduct(
        string calldata productSerialNumber,
        address currentOwnerAddress,
        string calldata clientLocation
    ) public view returns (bool) {
        if (bytes(productSerialNumber).length == 0)
            revert("serial number can not be empty");
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




// pragma solidity ^0.8.0;

// contract MedicalProductTracking {
//     address public contractOwner;

//     constructor() {
//         contractOwner = msg.sender;
//     }
//     modifier onlyContractOwner() {
//         require(
//             contractOwner == msg.sender,
//             "Only the contract owner can perform this action"
//         );
//         _;
//     }

//     struct ProductDetails {
//         address manufacturer;
//         string serialNumber;
//         string batchNumber;
//         string productName;
//         string location;
//         string timestamp;
//     }

//     struct ProductStatus {
//         address currentOwner;
//         string currentLocation;
//         string timestamp;
//     }

//     mapping(string => ProductDetails) public productRegistry;
//     mapping(string => ProductStatus[]) public productHistory;

//     event ProductRegistered(
//         address manufacturerAddress,
//         string manufacturerLocation,
//         string productSerialNumber,
//         string productBatchNumber,
//         string productName,
//         string timestamp
//     );

//     event ProductTransferred(
//         address from,
//         address to,
//         string productSerialNumber,
//         string timestamp
//     );

//     function registerProduct(
//         address manufacturerAddress,
//         string calldata manufacturerLocation,
//         string calldata productSerialNumber,
//         string calldata productBatchNumber,
//         string calldata productName
//     ) public returns (bool) {
//         require(
//             bytes(manufacturerLocation).length > 0,
//             "Invalid manufacturer address"
//         );
//         require(
//             manufacturerAddress != address(0),
//             "Invalid manufacturer address"
//         );
//         require(
//             bytes(productSerialNumber).length > 0,
//             "Product serial number cannot be empty"
//         );
//         require(
//             bytes(productBatchNumber).length > 0,
//             "Product batch number cannot be empty"
//         );
//         require(bytes(productName).length > 0, "Product name cannot be empty");
//         require(
//             bytes(productRegistry[productSerialNumber].timestamp).length == 0,
//             "Product is already registered"
//         );

//         string memory timestampStr = uint2str(block.timestamp);

//         productRegistry[productSerialNumber] = ProductDetails({
//             manufacturer: manufacturerAddress,
//             location: manufacturerLocation,
//             serialNumber: productSerialNumber,
//             batchNumber: productBatchNumber,
//             productName: productName,
//             timestamp: timestampStr
//         });

//         productHistory[productSerialNumber].push(
//             ProductStatus({
//                 currentOwner: manufacturerAddress,
//                 currentLocation: manufacturerLocation,
//                 timestamp: timestampStr
//             })
//         );

//         emit ProductRegistered(
//             manufacturerAddress,
//             manufacturerLocation,
//             productSerialNumber,
//             productBatchNumber,
//             productName,
//             timestampStr
//         );
//         return true;
//     }

//     function transferOwnership(
//         address previousOwnerAddress,
//         address newOwnerAddress,
//         string calldata newLocation,
//         string calldata productSerialNumber
//     ) public {
//         require(
//             previousOwnerAddress != address(0),
//             "Invalid previous owner address"
//         );
//         require(newOwnerAddress != address(0), "Invalid new owner address");
//         require(bytes(newLocation).length > 0, "New location cannot be empty");
//         require(
//             bytes(productSerialNumber).length > 0,
//             "Product serial number cannot be empty"
//         );
//         require(
//             productHistory[productSerialNumber].length > 0,
//             "Invalid serial number"
//         );

//         uint len = productHistory[productSerialNumber].length;
//         ProductStatus memory product = productHistory[productSerialNumber][
//             len - 1
//         ];
//         require(
//             previousOwnerAddress == product.currentOwner,
//             "Previous owner does not own this product"
//         );
//         require(
//             newOwnerAddress != previousOwnerAddress,
//             "Cannot transfer ownership to the same address"
//         );

//         string memory timestampStr = uint2str(block.timestamp);
//         productHistory[productSerialNumber].push(
//             ProductStatus({
//                 currentOwner: newOwnerAddress,
//                 currentLocation: newLocation,
//                 timestamp: timestampStr
//             })
//         );

//         emit ProductTransferred(
//             previousOwnerAddress,
//             newOwnerAddress,
//             productSerialNumber,
//             timestampStr
//         );
//     }

//     function getProductHistory(
//         string calldata productSerialNumber
//     ) public view returns (ProductStatus[] memory) {
//         require(
//             bytes(productSerialNumber).length > 0,
//             "Serial number cannot be empty"
//         );
//         require(
//             productHistory[productSerialNumber].length > 0,
//             "Invalid serial number"
//         );
//         return productHistory[productSerialNumber];
//     }

//     function getProduct(
//         string calldata productSerialNumber
//     ) public view returns (ProductStatus memory) {
//         require(
//             bytes(productSerialNumber).length > 0,
//             "Serial number cannot be empty"
//         );
//         uint len = productHistory[productSerialNumber].length;
//         require(len > 0, "Invalid serial number");
//         return productHistory[productSerialNumber][len - 1];
//     }

//     function checkProduct(
//         string calldata productSerialNumber,
//         address currentOwnerAddress,
//         string calldata clientLocation
//     ) public view returns (bool) {
//         require(
//             bytes(productSerialNumber).length > 0,
//             "serial number cannot be empty"
//         );

//         ProductStatus[] memory history = productHistory[productSerialNumber];
//         uint len = history.length;

//         require(len > 0, "No product history found"); // Added require

//         ProductStatus memory product = history[len - 1];

//         require(
//             currentOwnerAddress == product.currentOwner,
//             "Incorrect owner address"
//         ); // added require

//         require(
//             keccak256(bytes(clientLocation)) ==
//                 keccak256(bytes(product.currentLocation)),
//             "Incorrect location"
//         ); // added require

//         return true;
//     }

//     function uint2str(uint _i) internal pure returns (string memory) {
//         if (_i == 0) return "0";
//         uint j = _i;
//         uint length;
//         while (j != 0) {
//             length++;
//             j /= 10;
//         }
//         bytes memory bstr = new bytes(length);
//         while (_i != 0) {
//             bstr[--length] = bytes1(uint8(48 + (_i % 10)));
//             _i /= 10;
//         }
//         return string(bstr);
//     }
// }
