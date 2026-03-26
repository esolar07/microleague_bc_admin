interface PlusIconProps {
    className?: string;
}

const PlusIcon = ({ className = "" }: PlusIconProps) => {
    return (
        <svg
            className={`text-[12px] sm:text-[14px] ${className}`}
            width="1em"
            height="1em"
            viewBox="0 0 14 14"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            <g clipPath="url(#clip0_5235_698)">
                <path
                    d="M12.7695 5.76953H8.23047V1.23047C8.23047 0.550894 7.67957 0 7 0C6.32043 0 5.76953 0.550894 5.76953 1.23047V5.76953H1.23047C0.550894 5.76953 0 6.32043 0 7C0 7.67957 0.550894 8.23047 1.23047 8.23047H5.76953V12.7695C5.76953 13.4491 6.32043 14 7 14C7.67957 14 8.23047 13.4491 8.23047 12.7695V8.23047H12.7695C13.4491 8.23047 14 7.67957 14 7C14 6.32043 13.4491 5.76953 12.7695 5.76953Z"
                    fill="currentColor"
                />
            </g>
            <defs>
                <clipPath id="clip0_5235_698">
                    <rect width="14" height="14" fill="white" />
                </clipPath>
            </defs>
        </svg>
    );
};

export default PlusIcon;
