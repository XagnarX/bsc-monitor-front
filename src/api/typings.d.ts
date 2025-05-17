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
}