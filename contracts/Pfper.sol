//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Pfper is ERC721, Ownable {
    uint256 _cost;
    uint256 _nextId;

    mapping(uint256 => string) _tokenURIs;
    mapping(string => uint256) _minted;
    mapping(uint256 => address) _authors;

    constructor(uint256 cost) ERC721("pfper", "PFPER") Ownable() {
        _cost = cost;
        _nextId = 1;
    }

    function tokenSupply() public view returns (uint256) {
        return _nextId - 1;
    }

    function getCost() public view returns (uint256) {
        return _cost;
    }

    function setCost(uint256 cost) public onlyOwner {
        _cost = cost;
    }

    function mintPfp(string memory ipfsURI) public payable {
        require(msg.value >= _cost, 'mint payment insufficient');
        require(_minted[ipfsURI] == 0, 'pfp already minted');
        uint256 tokenId = _nextId;
        _nextId++;
        _tokenURIs[tokenId] = ipfsURI;
        _minted[ipfsURI] = tokenId;
        _authors[tokenId] = msg.sender;
        _safeMint(msg.sender, tokenId);
    }

    function authorOf(uint256 tokenId) public view returns (address) {
        return _authors[tokenId];
    }

    function tokenURI(uint256 tokenId) override public view returns (string memory) {
        return _tokenURIs[tokenId];
    }

    function withdraw() public onlyOwner {
        payable(msg.sender).transfer(address(this).balance);
    }
}
