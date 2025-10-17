export interface CliOptions {
  protobuf: string;
  catalog: string;
  output: string;
  itemRange?: string;
  outfitRange?: string;
  mode?: "items" | "outfits" | "both";
  direction?: string;
  animationType?: string;
  lookHead?: string;
  lookBody?: string;
  lookLegs?: string;
  lookFeet?: string;
  lookAddons?: string;
  help?: boolean;
}
