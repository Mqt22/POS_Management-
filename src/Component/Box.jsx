const Box = ({
    width,
    height,
    Subtitle,
    Title,
    Amount,
    Icon,
    color
}) => {
  return (
        <div className="flex min-w-0 flex-col items-center justify-center rounded-2xl border border-[#2f4a2b] bg-[#121812] px-4" style={{ width:width, height:height }}>
            {/* Left Container */}
            <div className="flex justify-between items-center p-2 flex-1 w-full h-full">
                <h4 className="text-[1rem] font-medium text-gray-400">{Subtitle}</h4>
                {Icon && <Icon className="shrink-0 text-2xl" style={{ color }} />}
            </div>
            {/* Right Container */}
            <div className="flex justify-start items-center flex-1 flex-col w-full h-full gap-2">
                <h1 className="text-3xl font-bold text-gray-300">{Amount}</h1>
                <h4 className="text-[1rem] font-medium text-gray-400 pb-2">{Title}</h4>
            </div>
        </div>
  )
}

export default Box
