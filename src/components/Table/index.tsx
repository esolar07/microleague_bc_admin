import React from "react";
import Loader from "@/components/Loader";

type Column = {
  key: string;
  label: React.ReactNode;
};

type RowData = {
  [key: string]: string | number | React.ReactNode;
};

type TokenTableProps = {
  columns: Column[];
  data: RowData[];
  className?: string;
  headClass?: string;
  bodyClass?: string;
  isLoading?: boolean;
  loadingSize?: number;
};

const Table: React.FC<TokenTableProps> = ({
  columns,
  data,
  className = "",
  headClass = "",
  isLoading = false,
  loadingSize,
}) => {
  return (
    <div>
      <div
        className={`overflow-x-auto overflow-y-auto  hideScrollbar sm:p-[30px] p-[20px] ${className} bg-white rounded-[20px]`}
        style={{ boxShadow: "0px 0px 20px 0px #00000014" }}
      >
        <table
          className="min-w-full text-center"
          style={{ borderSpacing: "8px 0", borderCollapse: "separate" }}
        >
          <thead>
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`${headClass} whitespace-nowrap align-bottom`}
                >
                  <span className="text-xs font-normal text-[#666666] whitespace-nowrap border-b border-[#DFDFDF] pb-3 block sticky top-0 bg-white z-10">
                    {col.label}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={columns.length} className="py-20 text-center">
                  <Loader loading={true} size={loadingSize || 48} />
                </td>
              </tr>
            ) : !data || data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="py-20 text-center text-sm text-[#666666]"
                >
                  No data available
                </td>
              </tr>
            ) : (
              data.map((row, idx) => (
                <tr key={idx}>
                  {columns.map((col) => {
                    const value = row[col.key];
                    return (
                      <td
                        key={col.key}
                        className=" whitespace-nowrap align-bottom"
                      >
                        <div className="py-3">
                          <span className="text-sm text-[#333333] inline-block">
                            {value}
                          </span>
                          <div className="border-b border-[#F1E7FF] mt-3"></div>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Table;
