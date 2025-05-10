declare namespace API {

  type TargetPage = {
    total?: number,
    targets?: Array<Target>,
  }

  type AnalysisPage = {
    total?: number,
    results?: Array<AnalysisResult>,
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
    tag?: string,
    min_block_num?: number,
    max_block_num?: number,
    min_value?: number,
    max_value?: number,
    is_new_address: boolean,
    order_by?: string, //block_number
    order?: string,//desc or asc
    limit?: number,
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
}