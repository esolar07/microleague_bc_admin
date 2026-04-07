import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { InfoIcon } from "../icons";

export type StageFormShape = {
  price: string;
  offeredTokens: string;
  minBuyTokens: string;
  maxBuyTokens: string;
  startDate: string;
  endDate: string;
  cliffDays: string;
  durationDays: string;
  whitelistOnly: boolean;
  releaseIntervalDays: any;
};

type Props = {
  form: StageFormShape;
  setForm: React.Dispatch<React.SetStateAction<StageFormShape>>;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  isCreating: boolean;
  isConnected?: boolean;
  onCancel?: () => void;
};

export default function CreateStageForm({
  form,
  setForm,
  onSubmit,
  isCreating,
  isConnected = true,
  onCancel,
}: Props) {
  return (
    <form className="space-y-4 py-4" onSubmit={onSubmit}>
      <div className="grid md:grid-cols-2 gap-4 items-start">
        <div className="space-y-2">
          <div className="flex items-center gap-x-1">
            <Label htmlFor="price">Token Price (USD)</Label>
            <div className="relative cursor-pointer group">
              <InfoIcon />
              <div className="absolute bottom-full hidden group-hover:block cardShadow left-0 bg-white rounded-[20px] p-5 w-[350px] text-center text-muted-foreground text-xs">
                The price per token for this stage. Investors will purchase
                tokens at this rate.
              </div>
            </div>
          </div>
          <Input
            id="price"
            type="number"
            step="0.000000000000000001"
            min="0"
            required
            value={form.price}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, price: event.target.value }))
            }
            className="bg-background border-border"
          />
          <p className="text-xs text-muted-foreground">
            Stored as a fixed 18-decimal USD price per token.
          </p>
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-x-1">
            <Label htmlFor="offeredTokens">Tokens Offered</Label>
            <div className="relative cursor-pointer group">
              <InfoIcon />
              <div className="absolute bottom-full hidden group-hover:block cardShadow right-0 bg-white rounded-[20px] p-5 w-[350px] text-center text-muted-foreground text-xs">
                The total number of tokens allocated for sale in this stage.
              </div>
            </div>
          </div>
          <Input
            id="offeredTokens"
            type="number"
            step="0.0001"
            min="0"
            required
            value={form.offeredTokens}
            onChange={(event) =>
              setForm((prev) => ({
                ...prev,
                offeredTokens: event.target.value,
              }))
            }
            className="bg-background border-border"
          />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-x-1">
            <Label htmlFor="minBuyTokens">Min Purchase (tokens)</Label>
            <div className="relative cursor-pointer group">
              <InfoIcon />
              <div className="absolute bottom-full hidden group-hover:block cardShadow left-0 bg-white rounded-[20px] p-5 w-[350px] text-center text-muted-foreground text-xs">
                The Min number of tokens a single wallet can buy during this
                stage.
              </div>
            </div>
          </div>
          <Input
            id="minBuyTokens"
            type="number"
            step="0.0001"
            min="0"
            required
            value={form.minBuyTokens}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, minBuyTokens: event.target.value }))
            }
            className="bg-background border-border"
          />
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-x-1">
            <Label htmlFor="maxBuyTokens">Max Purchase (tokens)</Label>
            <div className="relative cursor-pointer group">
              <InfoIcon />
              <div className="absolute bottom-full hidden group-hover:block cardShadow right-0 bg-white rounded-[20px] p-5 w-[350px] text-center text-muted-foreground text-xs">
                The maximum number of tokens a single wallet can buy during this
                stage.
              </div>
            </div>
          </div>
          <Input
            id="maxBuyTokens"
            type="number"
            step="0.0001"
            min="0"
            required
            value={form.maxBuyTokens}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, maxBuyTokens: event.target.value }))
            }
            className="bg-background border-border"
          />
        </div>
      </div>

      {/* <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-x-1">
            <Label htmlFor="softCapTokens">Soft Cap (tokens)</Label>
            <div className="relative cursor-pointer group">
              <InfoIcon />
              <div className="absolute bottom-full hidden group-hover:block cardShadow left-0 bg-white rounded-[20px] p-5 w-[350px] text-center text-muted-foreground text-xs">
                The minimum funding amount required for this stage to be
                considered successful.
              </div>
            </div>
          </div>
          <Input
            id="softCapTokens"
            type="number"
            step="0.0001"
            min="0"
            value={form.softCapTokens}
            onChange={(event) =>
              setForm((prev) => ({
                ...prev,
                softCapTokens: event.target.value,
              }))
            }
            placeholder="Defaults to 50% of offered tokens"
            className="bg-background border-border"
          />
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-x-1">
            <Label htmlFor="hardCapTokens">Hard Cap (tokens)</Label>
            <div className="relative cursor-pointer group">
              <InfoIcon />
              <div className="absolute bottom-full hidden group-hover:block cardShadow right-0 bg-white rounded-[20px] p-5 w-[350px] text-center text-muted-foreground text-xs">
                The maximum amount of funds that can be raised for this stage.
                Sales stop once reached.
              </div>
            </div>
          </div>
          <Input
            id="hardCapTokens"
            type="number"
            step="0.0001"
            min="0"
            value={form.hardCapTokens}
            onChange={(event) =>
              setForm((prev) => ({
                ...prev,
                hardCapTokens: event.target.value,
              }))
            }
            placeholder="Defaults to tokens offered"
            className="bg-background border-border"
          />
        </div>
      </div> */}

      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-x-1">
            <Label htmlFor="startDate">Start Date</Label>
            <div className="relative cursor-pointer group">
              <InfoIcon />
              <div className="absolute bottom-full hidden group-hover:block cardShadow left-0 bg-white rounded-[20px] p-5 w-[350px] text-center text-muted-foreground text-xs">
                The date when this presale stage becomes active and purchasing
                begins.
              </div>
            </div>
          </div>
          <Input
            id="startDate"
            type="datetime-local"
            required
            value={form.startDate}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, startDate: event.target.value }))
            }
            className="bg-background border-border"
          />
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-x-1">
            <Label htmlFor="endDate">End Date</Label>
            <div className="relative cursor-pointer group">
              <InfoIcon />
              <div className="absolute bottom-full hidden group-hover:block cardShadow right-0 bg-white rounded-[20px] p-5 w-[350px] text-center text-muted-foreground text-xs">
                The date when this presale stage closes or transitions to the
                next phase.
              </div>
            </div>
          </div>
          <Input
            id="endDate"
            type="datetime-local"
            required
            value={form.endDate}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, endDate: event.target.value }))
            }
            className="bg-background border-border"
          />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-x-1">
            <Label htmlFor="cliffDays">Cliff (days)</Label>
            <div className="relative cursor-pointer group">
              <InfoIcon />
              <div className="absolute bottom-full hidden group-hover:block cardShadow left-0 bg-white rounded-[20px] p-5 w-[350px] text-center text-muted-foreground text-xs">
                Number of days before vesting begins. Tokens remain locked until
                the cliff period ends.
              </div>
            </div>
          </div>
          <Input
            id="cliffDays"
            type="number"
            min="0"
            value={form.cliffDays}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, cliffDays: event.target.value }))
            }
            className="bg-background border-border"
          />
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-x-1">
            <Label htmlFor="durationDays">Vesting Duration (days)</Label>
            <div className="relative cursor-pointer group">
              <InfoIcon />
              <div className="absolute bottom-full hidden group-hover:block cardShadow right-0 bg-white rounded-[20px] p-5 w-[350px] text-center text-muted-foreground text-xs">
                Total number of days over which tokens will be gradually
                released after the cliff.
              </div>
            </div>
          </div>
          <Input
            id="durationDays"
            type="number"
            min="0"
            value={form.durationDays}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, durationDays: event.target.value }))
            }
            className="bg-background border-border"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="releaseIntervalDays">
            Release Interval (minutes)
          </Label>
          <Input
            id="releaseIntervalDays"
            type="number"
            min="0"
            value={form.releaseIntervalDays}
            onChange={(event) =>
              setForm((prev) => ({
                ...prev,
                releaseIntervalDays: event.target.value,
              }))
            }
            placeholder="0 for instant release"
            className="bg-background border-border"
          />
          <p className="text-xs text-muted-foreground">
            Interval in minutes between token releases during vesting
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6 pt-2">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <p className="font-medium text-foreground">Whitelist required</p>
            <p className="text-xs text-muted-foreground">
              Restrict purchases to whitelisted accounts
            </p>
          </div>
          <Switch
            checked={form.whitelistOnly}
            onCheckedChange={(checked) =>
              setForm((prev) => ({ ...prev, whitelistOnly: checked }))
            }
          />
        </div>
      </div>

      <div className="flex justify-between items-center pt-4">
        {!isConnected && (
          <p className="text-xs text-muted-foreground">
            Connect your admin wallet to create a stage.
          </p>
        )}
        <div className="flex gap-3 ml-auto">
          <Button
            type="button"
            variant="outline"
            className="border-border hover:border-primary/50"
            onClick={onCancel}
            disabled={isCreating}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
            disabled={isCreating}
          >
            {isCreating ? "Creating…" : "Create Stage"}
          </Button>
        </div>
      </div>
    </form>
  );
}
