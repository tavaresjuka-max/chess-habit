let operationEpoch = 0;

export function getOperationEpoch(): number {
  return operationEpoch;
}

export function bumpOperationEpoch(): number {
  operationEpoch += 1;
  return operationEpoch;
}

export function isCurrentOperationEpoch(epoch: number): boolean {
  return epoch === operationEpoch;
}
