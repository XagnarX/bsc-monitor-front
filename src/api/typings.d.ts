declare namespace API {

  type TargetPage = {
    total?: number,
    targets?: Array<Target>,
  }

  type AnalysisPage = {
    total?: number,
    results?: Array<AnalysisResult>,
  }

  type TagPage = {
    total?: number,
    tags?: Array<Target>,
  }

  type Target ={
    address?: string
    tag?: string
    min_value?: string
    max_value?: string
  }

  type DeleteTarget = {
    address:string
    tag:string
  }

  type AnalysisQuery = {
    address?: string;
    from_address?: string;
    tag?: string;
    min_block_num?: number;
    max_block_num?: number;
    min_value?: number;
    max_value?: number;
    is_new_address: boolean;
    order_by?: string;
    order?: string;
    limit?: number;
    from_addresses?: string;
    start_time?: string;
    end_time?: string;
  }
  type AnalysisResult = {
    ID?: number;
    Address?: string;
    Tag?: string;
    TxHash?: string;
    Value?: string;
    FromAddress?: string;
    BlockNumber?: number;
    IsNewAddress?: boolean;
    CreatedAt?: string;
    UpdatedAt?: string;
  }

  type QueryTag = {
    monitor_address:string
  }

  type PinnedAddress = {
    address: string
    tag: string
    created_at: string
    updated_at: string
  }

  type PinnedAddressesResponse = {
    addresses: PinnedAddress[] | null
    total: number
  }

  interface ActivityRecord {
    address: string
    tag: string
    tx_count: number
    total_in: string
    total_out: string
    last_active: string
    period: Period
    is_pinned: boolean
  }

  interface BlacklistRecord {
    id: number
    to_address: string
    data_source: string
    tag?: string
    created_at: string
  }

  interface BlacklistPage {
    total: number
    blacklist: BlacklistRecord[]
  }

  // Internal Transactions related types
  interface InternalTransaction {
    blockNumber: string
    contractAddress: string
    errCode: string
    from: string
    gas: string
    gasUsed: string
    hash: string
    input: string
    isError: string
    timeStamp: string
    to: string
    traceId: string
    type: string
    value: string
  }

  interface InternalTransactionsResponse {
    message: string
    page: number
    page_size: number
    result: InternalTransaction[]
    status: string
    total: number
    total_pages: number
  }

  interface InternalTransactionsQuery {
    module?: string
    action?: string
    address?: string
    startblock?: number
    endblock?: number
    page?: number
    offset?: number
    sort?: 'asc' | 'desc'
    min_block_txs?: number
    min_subcalls?: number
  }
}