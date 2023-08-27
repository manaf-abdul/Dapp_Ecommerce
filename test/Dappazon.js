const { expect } = require("chai")
const { ethers } = require("hardhat")

const tokens = (n) => {
  return ethers.utils.parseUnits(n.toString(), 'ether')
}
describe("Dappazon", () => {
  let dappazon
  let deployer
  let buyer

  beforeEach(async () => {
    [deployer, buyer] = await ethers.getSigners()
    const Dappazon = await ethers.getContractFactory("Dappazon")
    dappazon = await Dappazon.deploy()
  })

  describe("deployment", () => {

    it("Sets the owner", async () => {
      expect(await dappazon.owner()).to.equal(deployer.address)
    })
  })

  describe("listing", () => {
    let transaction

    beforeEach(async () => {
      transaction = await dappazon.connect(deployer).list(
        ID, NAME, CATEGORY, IMAGE, COST, RATING, STOCK
      )
      await transaction.wait()
    })

    it("Returns item attributes", async () => {
      const item = await dappazon.items(1)
      expect(item._id).to.equal(1)
    })

    it("Emits list event", () => {
      expect(transaction).to.emit(dappazon, "List")
    })
  })


  describe("Buying", () => {
    let transaction

    beforeEach(async () => {
      transaction = await dappazon.connect(deployer).list(
        ID, NAME, CATEGORY, IMAGE, COST, RATING, STOCK
      )
      await transaction.wait()
      //Buy an item

      transaction = await dappazon.connect(buyer).buy(ID, { value: COST })
    })

    it("Update buyers order count", async() => {
      const result= await dappazon.orderCount(buyer.address)
      expect(result).to.equal(1)
    })

    it("Adds the order", async() => {
      const order= await dappazon.orders(buyer.address,1)
      expect(order.item._name).to.equal(NAME)
    })

    it("Update the contract balance", async() => {
      const result= await ethers.provider.getBalance(dappazon.address)
      expect(result).to.equal(COST)
    })

    it("Emits Buy Event", async() => {
      expect(transaction).to.emit(dappazon, "Buy")
    })
  })
  
  describe("Withdrawing", () => {
    let balanceBefore

    beforeEach(async () => {
      // List a item
      let transaction = await dappazon.connect(deployer).list(ID, NAME, CATEGORY, IMAGE, COST, RATING, STOCK)
      await transaction.wait()

      // Buy a item
      transaction = await dappazon.connect(buyer).buy(ID, { value: COST })
      await transaction.wait()

      // Get Deployer balance before
      balanceBefore = await ethers.provider.getBalance(deployer.address)

      // Withdraw
      transaction = await dappazon.connect(deployer).withdraw()
      await transaction.wait()
    })

    it('Updates the owner balance', async () => {
      const balanceAfter = await ethers.provider.getBalance(deployer.address)
      expect(balanceAfter).to.be.greaterThan(balanceBefore)
    })

    it('Updates the contract balance', async () => {
      const result = await ethers.provider.getBalance(dappazon.address)
      expect(result).to.equal(0)
    })
  })
})
