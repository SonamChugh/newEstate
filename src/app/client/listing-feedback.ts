export enum FeedbackValue {
  NotHappy = -1,
  Happy = 1,
  Maybe = 0
}


export class ListingFeedback {
  id: number;
  requestId: number;
  listingId: number;
  value: FeedbackValue;
}
