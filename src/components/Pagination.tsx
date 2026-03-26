'use client';
import ReactPaginate from 'react-paginate';
import { ChevronLeftPagination } from './icons';
import { ChevronRightPagination } from './icons';

interface PaginationProps {
    currentPage: number;
    pageCount: number;
    onPageChange: (selectedItem: { selected: number }) => void;
}

const Pagination: React.FC<PaginationProps> = ({ currentPage, pageCount, onPageChange }) => {
    return (
        <ReactPaginate
            previousLabel={<ChevronLeftPagination />}
            nextLabel={<ChevronRightPagination />}
            breakLabel="..."
            onPageChange={onPageChange}
            pageCount={pageCount}
            forcePage={currentPage}
            marginPagesDisplayed={2}
            pageRangeDisplayed={3}
            containerClassName="flex items-center justify-center space-x-2 sm:mt-4 "
            pageClassName="h-10 w-10 xs:h-8  xs:w-8 xs:text-xs flex items-center justify-center border border-[#DFDFDF] rounded-[10px] text-[#666666]"
            pageLinkClassName="w-full h-full flex items-center justify-center "
            activeClassName="border-[#7529ED]  border text-[#7529ED] "
            previousClassName={`h-10 w-10 xs:h-8 xs:w-8 bg-inherit flex items-center justify-center border border-[#DFDFDF] rounded-[10px] ${currentPage > 0 ? 'bg-[#0958A7]  text-white' : 'text-white'
                }`}
            nextClassName={`h-10 w-10  xs:h-8 xs:w-8 flex items-center justify-center border border-[#DFDFDF] rounded-[10px] ${currentPage < pageCount - 1 ? ' text-white' : ' text-[#009DFF] '
                }`}
            disabledClassName="cursor-not-allowed opacity-50"
            breakClassName="text-white"
        />
    );
};

export default Pagination;
