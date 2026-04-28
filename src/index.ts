import Web3ProviderEngine from "web3-provider-engine";
// @ts-ignore - web3-provider-engine doesn't have declaration files for these subproviders
import FiltersSubprovider from "web3-provider-engine/subproviders/filters";
// @ts-ignore
import NonceSubProvider from "web3-provider-engine/subproviders/nonce-tracker";
// @ts-ignore
import HookedSubprovider from "web3-provider-engine/subproviders/hooked-wallet";
// @ts-ignore
import ProviderSubprovider from "web3-provider-engine/subproviders/provider";
// @ts-ignore
import RpcProvider from "web3-provider-engine/subproviders/rpc";
// @ts-ignore
import WebsocketProvider from "web3-provider-engine/subproviders/websocket";
import { v4 as uuid } from 'uuid';
import { Config } from "./safeheron-config"

import {URL} from "url";
import type {
  JSONRPCRequestPayload,
  JSONRPCResponsePayload
} from "ethereum-protocol";
import {
  CreateWeb3EthSignTransactionRequest,
  OneWeb3SignRequest,
  Web3Api,
} from "@safeheron/api-sdk";

const singletonNonceSubProvider = new NonceSubProvider();

const PLUGIN_NAME = "truffle-safeheron";

const hexToWei = (hex: string): string => BigInt(hex).toString(10);

class SafeheronProvider {
  private initialized: Promise<void>;
  public engine: Web3ProviderEngine;
  private chainId: number | undefined;
  private _safeheronWeb3Api: Web3Api;
  private readonly _web3WalletAccountKey: string;
  private readonly _web3WalletEVMAddress: string;

  constructor(
    protected readonly provider: any,
    protected readonly _config: Config) {

    // check network, only public networks are supported
    if (provider.includes("localhost") || provider.includes("127.0.0.1")) {
      throw new Error(`[${PLUGIN_NAME}]only public networks are supported.`);
    }

    // check safeheron config
    if (!_config.baseUrl || !_config.apiKey || !_config.rsaPrivateKey
      || !_config.safeheronRsaPublicKey || !_config.web3WalletAccountKey
      || !_config.web3WalletEVMAddress) {
      throw new Error(`[${PLUGIN_NAME}]required config missing.`);
    }

    const yourPrivateKey = _config.rsaPrivateKey.trim()
    const safeheronPublicKey = _config.safeheronRsaPublicKey.trim()

    this.engine = new Web3ProviderEngine({
      pollingInterval: 4000
    });

    this._safeheronWeb3Api = new Web3Api({
      baseUrl: _config.baseUrl,
      apiKey: _config.apiKey,
      rsaPrivateKey: yourPrivateKey,
      safeheronRsaPublicKey: safeheronPublicKey,
      requestTimeout: _config.requestTimeout!,
    })

    this._web3WalletAccountKey = _config.web3WalletAccountKey;
    this._web3WalletEVMAddress = _config.web3WalletEVMAddress;

    let providerToUse;
    if (SafeheronProvider.isValidProvider(provider)) {
      providerToUse = provider;
    } else {
      throw new Error(
        [
          `No provider or an invalid provider was specified: '${provider}'`,
          "Please specify a valid provider or URL, using the http, https, " +
          "ws, or wss protocol.",
          ""
        ].join("\n")
      );
    }

    this.initialized = this.initialize();
    const self = this;

    this.engine.addProvider(
      new HookedSubprovider({
        getAccounts(cb: any) {
          cb(null, [self._web3WalletEVMAddress]);
        },
        async signTransaction(txParams: any, cb: any) {
          try {
            await self.initialized;
            const txKey = await self.createTransaction(txParams);
            const signedTransaction = await self.getSignedTransaction(txKey);
            cb(null, signedTransaction);
          } catch (e) {
            cb(e, null)
          }
        }
      })
    );

    this.engine.addProvider(singletonNonceSubProvider);

    this.engine.addProvider(new FiltersSubprovider());
    if (typeof providerToUse === "string") {
      const url = providerToUse;

      const providerProtocol = (new URL(url).protocol || "http:").toLowerCase();

      switch (providerProtocol) {
        case "ws:":
        case "wss:":
          this.engine.addProvider(new WebsocketProvider({rpcUrl: url}));
          break;
        default:
          this.engine.addProvider(new RpcProvider({rpcUrl: url}));
      }
    } else {
      this.engine.addProvider(new ProviderSubprovider(providerToUse));
    }

    // Required by the provider engine.
    this.engine.start();
  }

  private async getSignedTransaction(txKey: string): Promise<string> {
    const retrieveRequest: OneWeb3SignRequest = {
      txKey: txKey
    };

    for (; ;) {
      const retrieveResponse = await this._safeheronWeb3Api.oneWeb3Sign(retrieveRequest)
      if (retrieveResponse.transactionStatus === 'FAILED' || retrieveResponse.transactionStatus === 'REJECTED') {
        throw new Error(`[${PLUGIN_NAME}] eth_signTransaction was REJECTED or FAILED, please try again.`);
      }
      if (retrieveResponse.transactionStatus === 'SIGN_COMPLETED') {
        console.log(`[${PLUGIN_NAME}] success, signature has been obtained`);
        return retrieveResponse.transaction.signedTransaction
      }
      console.log(`[${PLUGIN_NAME}] Waiting for signature...`);
      await new Promise(r => setTimeout(r, 2000));
    }
  }

  private async createTransaction(txData: any): Promise<string> {
    const {data, gas, maxFeePerGas, maxPriorityFeePerGas, nonce, value, gasPrice, to} = txData
    const transaction: CreateWeb3EthSignTransactionRequest['transaction'] = {
      to,
      value: typeof value !== 'undefined' ? hexToWei(value) : '0',
      chainId: this.chainId!,
      gasLimit: parseInt(gas, 16),
      nonce: parseInt(nonce, 16),
      data: data,
    };
    if (typeof maxFeePerGas !== 'undefined' && typeof maxPriorityFeePerGas !== 'undefined') {
      transaction.maxFeePerGas = hexToWei(maxFeePerGas);
      transaction.maxPriorityFeePerGas = hexToWei(maxPriorityFeePerGas);
    } else {
      transaction.gasPrice = hexToWei(gasPrice);
    }
    const request: CreateWeb3EthSignTransactionRequest = {
      customerRefId: uuid(),
      accountKey: this._web3WalletAccountKey,
      transaction,
    };
    const createResult = await this._safeheronWeb3Api.createWeb3EthSignTransaction(request);
    console.log(`[${PLUGIN_NAME}]request eth_signTransaction success, please review and approve on safeheron mobile app`);
    return createResult.txKey;
  }

  private initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.engine.sendAsync(
        {
          jsonrpc: "2.0",
          id: Date.now(),
          method: "eth_chainId",
          params: []
        },
        // @ts-ignore - the type doesn't take into account the possibility
        // that response.error could be a thing
        (error: any, response: JSONRPCResponsePayload & { error?: any }) => {
          if (error) {
            reject(error);
            return;
          } else if (response.error) {
            reject(response.error);
            return;
          }
          if (isNaN(parseInt(response.result, 16))) {
            const message =
              "When requesting the chain id from the node, it" +
              `returned the malformed result ${response.result}.`;
            throw new Error(message);
          }
          this.chainId = parseInt(response.result, 16);
          resolve();
        }
      );
    });
  }

  public send(
    payload: JSONRPCRequestPayload,
    // @ts-ignore we patch this method so it doesn't conform to type
    callback: (error: null | Error, response: JSONRPCResponsePayload) => void
  ): void {
    this.initialized.then(() => {
      this.engine.sendAsync(payload, callback);
    });
  }

  public sendAsync(
    payload: JSONRPCRequestPayload,
    callback: (error: null | Error, response: JSONRPCResponsePayload) => void
  ): void {
    this.initialized.then(() => {
      this.engine.sendAsync(payload, callback);
    });
  }

  public getAddress(idx?: number): string {
    return this._web3WalletEVMAddress;
  }

  public getAddresses(): string[] {
    return [this.getAddress()];
  }

  public static isValidProvider(provider: any): boolean {
    if (!provider) return false;
    if (typeof provider === "string") {
      const validProtocols = ["http:", "https:", "ws:", "wss:"];
      const url = new URL(provider.toLowerCase());
      return !!validProtocols.includes(url.protocol || "");
    } else if ("request" in provider) {
      // provider is an 1193 provider
      return true;
    } else if ("send" in provider) {
      // provider is a "legacy" provider
      return true;
    }
    return false;
  }
}

export = SafeheronProvider;
