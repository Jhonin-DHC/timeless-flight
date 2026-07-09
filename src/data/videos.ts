export interface VideoResource {
  id: string;
  title: string;
  description: string;
  url: string;
}

export const videos: VideoResource[] = [
  {
    id: "vid_1",
    title: "Submariner Buying Notes",
    description: "A short walkthrough of trusted references and what to verify before buying.",
    url: "https://www.youtube.com"
  },
  {
    id: "vid_2",
    title: "Nautilus Market Snapshot",
    description: "Current trends in demand, premiums, and common pitfalls for buyers.",
    url: "https://www.youtube.com"
  }
];
