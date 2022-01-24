

interface InputParams {
  /** @default 25  */
  fps?: number
  /** @default 5  */
  loop?: number
  /** @default true  */
  transition?: boolean
  /** @default 1000  */
  captionDelay?: number
  /** @default 1  */
  transitionDuration?: number
  /** @default 'black'  */
  transitionColor?: string
  /** @default 1024  */
  videoBitrate?: number
  /** @default 'libx264'  */
  videoCodec?: string
  /** @default '640x?'  */
  size?: string
  /** @default '128k'  */
  audioBitrate?: string
  /** @default 2  */
  audioChannels?: number
  /** @default 'mp4'  */
  format?: string
  /** @default false  */
  useSubripSubtitles?: boolean
  /** @default null  */
  subtitleStyle?;
}

declare class VideoShow {
  private params: InputParams;
  private audioParams: any; // too lazy to fill these ones in
  private videoParams: any;
  private images: any;

  constructor(images: string[], options?: InputParams) {}

  // there are many encapsulated setters here, but I'm too lazy to declare them. just use constructor options

  /** 
   * @EventEmitter `'start'` returns (command); `'error'` returns (err, stdout, stderr), `'end'` returns (output)
   * @alias save()
   * */
  render(path: string): EventEmitter;
}

declare module "videoshow" {
  export = VideoShow;
}
