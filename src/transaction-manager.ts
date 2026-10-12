import { getNumericID, Logger } from './utils';
const LOG_NS = '[transaction-manager.ts]';

export type PendingTransaction = {
  id: number;
  owner: any;
  request: string;
  done: Function;
  error: Function;
  timeout: number;
};

export type Owner = {
  id: number;
};

class TransactionManager {
  transactions: Map<number, PendingTransaction>;
  id: number;

  /**
   * Create a Transacton Manager (TM)
   */
  constructor() {
    this.transactions = new Map();
    this.id = parseInt(getNumericID());
    Logger(`${LOG_NS} [${this.id}] creating new transaction manager`);
    //this._dbgtask = null;
    /* If tx debugging is enabled, periodically print the size of the tx table */
  }

  /**
   * Clear the internal transaction table and the debugging printing task.
   */
  clear() {
    Logger(`${LOG_NS} [${this.id}] clearing transaction manager`);
    //clearInterval(this._dbgtask);
    this.transactions.clear();
  }

  /**
   * Check if the TM has a specific transaction.
   */
  has(id: number) {
    if (!id) return false;
    return this.transactions.has(id);
  }

  /**
   * Get a specific transaction.
   */
  get(id: number) {
    if (!id) return null;
    if (!this.has(id)) return null;
    return this.transactions.get(id);
  }

  size() {
    return this.transactions.size;
  }

  /**
   * Add a pending transaction to the TM.
   */
  set(id: number, transaction: PendingTransaction) {
    if (!id) return;
    if (!transaction) return;
    this.transactions.set(id, transaction);
    Logger(`${LOG_NS} [${this.id}] TM DEBUG size=${this.size()}`);
  }

  /**
   * Delete a specific transaction from the TM.
   */
  delete(id: number) {
    if (!id) return;
    if (!this.has(id)) return;
    this.transactions.delete(id);
  }

  /**
   * Get the owner of a specific transaction id.
   */
  getTransactionOwner(id: number) {
    if (!id) return;
    if (!this.has(id)) return;
    //@ts-ignore
    return this.get(id).owner;
  }

  /**
   * Create a new transaction if id does not exist in the table and add it to the TM.
   */
  createTransaction({
    id,
    owner,
    request,
    done,
    error,
    timeout = 0,
  }: PendingTransaction) {
    if (this.has(id)) return;
    let tx = {
      id: id,
      owner: owner,
      request: request,
      done: done,
      error: error,
      timeout: timeout,
    };
    if (timeout > 0) {
      const timeout_ms: any = setTimeout(() => {
        this.delete(id);
        error(new Error('Transaction timed out!'));
        Logger(
          `${LOG_NS} [${owner.id}] closed with timeout transaction ${id}, request "${request}"`
        );
      }, timeout);
      tx.timeout = timeout_ms;
    }

    this.set(id, tx);

    Logger(owner);
    Logger(this.transactions);
    Logger(
      `${LOG_NS} [${tx.owner.id}]-------------------------------transactions--------------------------------------------`
    );

    Logger(
      `${LOG_NS} [${tx.owner.id}] created new transaction ${id}, request "${tx.request}"`
    );
    return tx;
  }

  /**
   * Close a transaction with an error if the id is found and the owner matches.
   * The closed transaction will be removed from the internal table and the error cb will be invoked with the error string.
   */
  closeTransactionWithError(id: number, owner: Owner, error: Error) {
    const tx = this.get(id);
    if (!tx) return;
    if (tx.owner !== owner) return;
    clearTimeout(tx.timeout);
    this.delete(id);
    tx.error(error);
    Logger(
      `${LOG_NS} [${tx.owner.id}] closed with error transaction ${id}, request "${tx.request}"`
    );
    return tx;
  }

  /**
   * Close all the stored transactions with an error.
   * If an owner is specified only the owner's transaction will be closed.
   * The closed transactions will be removed from the internal table.
   */
  closeAllTransactionsWithError(owner: Owner, error: Error) {
    for (const [_, pendingTx] of this.transactions) {
      if (!owner || pendingTx.owner === owner)
        this.closeTransactionWithError(pendingTx.id, pendingTx.owner, error);
    }
  }

  /**
   * Close a transaction with success if the id is found and the owner matches.
   * The closed transaction will be removed from the internal table and the success cb will be invoked with the specified data.
   */
  closeTransactionWithSuccess(id: number, owner: any, data: any) {
    const tx = this.get(id);
    if (!tx) return;
    if (tx.owner !== owner) return;
    clearTimeout(tx.timeout);
    this.delete(id);
    tx.done(data);
    Logger(
      `${LOG_NS} [${tx.owner.id}] closed with success transaction ${id}, request "${tx.request}"`
    );
    return tx;
  }
}

export default TransactionManager;
