import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const truncateAddress = (
  address: string,
  start: number = 6,
  end: number = 4
): string => {
  if (!address) return "";
  if (address.length <= start + end) return address;
  return `${address.slice(0, start)}...${address.slice(-end)}`;
};

export const formatNumber = (num: number, decimals = 2): string => {
  if (!num) return "$0";

  const abs = Math.abs(num);

  if (abs >= 1_000_000_000) {
    return `$${(num / 1_000_000_000).toFixed(decimals).replace(/\.00$/, "")} B`;
  }
  if (abs >= 1_000_000) {
    return `$${(num / 1_000_000).toFixed(decimals).replace(/\.00$/, "")} M`;
  }
  if (abs >= 1_000) {
    return `$${(num / 1_000).toFixed(decimals).replace(/\.00$/, "")} K`;
  }

  return `$${num.toFixed(decimals)}`;
};

export const formatWallet = (wallet: string) => {
  if (!wallet) return "N/A";
  return `${wallet.slice(0, 6)}...${wallet.slice(-4)}`;
};

// Add these utility functions to your existing utils file
export const formatterNumber = (num: number, decimals: number = 2): string => {
  if (num === 0) return "0";
  if (num < 0.01) return num.toFixed(4);
  if (num < 1) return num.toFixed(3);

  const formatter = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  return formatter.format(num);
};

export const formatDate = (date: Date | string | number): string => {
  if (!date) return "";

  const d =
    typeof date === "string" || typeof date === "number"
      ? new Date(date)
      : date;

  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const formatTimeAgo = (date: Date | string | number): string => {
  if (!date) return "";

  const d =
    typeof date === "string" || typeof date === "number"
      ? new Date(date)
      : date;

  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMinutes = Math.floor(diffMs / (1000 * 60));

  if (diffDays > 0) {
    return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
  } else if (diffHours > 0) {
    return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
  } else if (diffMinutes > 0) {
    return `${diffMinutes} minute${diffMinutes > 1 ? "s" : ""} ago`;
  } else {
    return "Just now";
  }
};
