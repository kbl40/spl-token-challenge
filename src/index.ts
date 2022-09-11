import { initializeKeypair } from "./initializeKeypair"
import createMint from "./createMint"
import * as web3 from "@solana/web3.js"
import {
  PublicKey,
  Signer,
} from '@solana/web3.js'
import { 
  ACCOUNT_SIZE,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountInstruction,
  createInitializeAccountInstruction,
  createInitializeMintInstruction, 
  createMintToInstruction, 
  getAssociatedTokenAddress, 
  getMinimumBalanceForRentExemptMint, 
  MINT_SIZE, 
  TOKEN_PROGRAM_ID } from '@solana/spl-token'
import * as token from '@solana/spl-token'
import {
  Metaplex,
  keypairIdentity,
  bundlrStorage,
  toMetaplexFile,
  findMetadataPda
} from '@metaplex-foundation/js'
import {
  DataV2, 
  createCreateMetadataAccountV2Instruction,
  createUpdateMetadataAccountV2Instruction
} from '@metaplex-foundation/mpl-token-metadata'
import * as fs from 'fs'

async function main() {
  const connection = new web3.Connection(web3.clusterApiUrl("devnet"))
  const user = await initializeKeypair(connection)
  const mintKeypair = web3.Keypair.generate()
  const accountKeypair = web3.Keypair.generate()

  const programId = TOKEN_PROGRAM_ID
  const accountProgramId = TOKEN_PROGRAM_ID
  const associatedTokenProgramId = ASSOCIATED_TOKEN_PROGRAM_ID
  const mintToProgramId = TOKEN_PROGRAM_ID

  const decimals = 2

  console.log("PublicKey:", user.publicKey.toBase58())

  const lamportsMint = await token.getMinimumBalanceForRentExemptMint(connection)
  const lamportsAccount = await token.getMinimumBalanceForRentExemptAccount(connection)

  const associatedToken = await getAssociatedTokenAddress(
    mintKeypair.publicKey,
    user.publicKey,
    false,
    programId,
    associatedTokenProgramId
  )

  //const mintInfo = await token.getMint(connection, mintKeypair.publicKey, undefined, programId)

  const filePath = 'assets/robot.png'
  const fileName = 'robot.png'
  const name = 'RoboCoin'
  const description = 'Crypto for robots, by robots.'
  const symbol = 'ROBO'

  const buffer = fs.readFileSync(filePath)

  const file = toMetaplexFile(buffer, fileName)

  const metaplex = Metaplex.make(connection)
    .use(keypairIdentity(user))
    .use(
      bundlrStorage({
        address: "https://devnet.bundlr.network",
        providerUrl: "https://api.devnet.solana.com",
        timeout: 60000
      })
    )

  const imageUri = await metaplex.storage().upload(file)
  console.log(imageUri)

  const { uri } = await metaplex.nfts().uploadMetadata({
    name: name,
    description: description,
    image: imageUri,
  })
  .run()

  console.log("Metadata uri:", uri)

  const metadataPDA = await findMetadataPda(mintKeypair.publicKey)

  const tokenMetadata = {
    name: name,
    symbol: symbol,
    uri: uri,
    sellerFeeBasisPoints: 0,
    creators: null,
    collection: null,
    uses: null
  } as DataV2

  const transaction = new web3.Transaction().add(
    // Create Mint Account
    web3.SystemProgram.createAccount({
        fromPubkey: user.publicKey,
        newAccountPubkey: mintKeypair.publicKey,
        space: MINT_SIZE,
        lamports: lamportsMint,
        programId
    }),
    // Initialize it as a Mint Account
    createInitializeMintInstruction(
        mintKeypair.publicKey,
        decimals,
        user.publicKey,
        user.publicKey,
        programId
    ),
    // Create Token Account
    web3.SystemProgram.createAccount({
      fromPubkey: user.publicKey,
      newAccountPubkey: accountKeypair.publicKey,
      space: ACCOUNT_SIZE,
      lamports: lamportsAccount,
      programId: accountProgramId
    }),
    // Initialize Token Account
    createInitializeAccountInstruction(
      accountKeypair.publicKey,
      mintKeypair.publicKey,
      user.publicKey,
      accountProgramId
    ),
    createCreateMetadataAccountV2Instruction(
      {
        metadata: metadataPDA,
        mint: mintKeypair.publicKey,
        mintAuthority: user.publicKey,
        payer: user.publicKey,
        updateAuthority: user.publicKey
      },
      {
        createMetadataAccountArgsV2: {
          data: tokenMetadata,
          isMutable: true
        }
      }
    ),
    // Create the Associated Token Account
    createAssociatedTokenAccountInstruction(
      user.publicKey,
      associatedToken,
      user.publicKey,
      mintKeypair.publicKey,
      programId,
      associatedTokenProgramId
    ),
    // Mint tokens
    createMintToInstruction(
      mintKeypair.publicKey,
      associatedToken,
      user.publicKey,
      100 * 10 ** decimals
    )
  )

  const txSig = await web3.sendAndConfirmTransaction(
      connection,
      transaction,
      [user, mintKeypair, accountKeypair]
  )

  console.log(
    `Token Mint, Account Creation, Mint: https://explorer.solana.com/tx/${txSig}?cluster=devnet`
  )
}

main()
  .then(() => {
    console.log("Finished successfully")
    process.exit(0)
  })
  .catch((error) => {
    console.log(error)
    process.exit(1)
  })
