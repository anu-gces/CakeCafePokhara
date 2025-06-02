const SplashScreen = () => {
  return (
    <div className="z-50 absolute inset-0 flex justify-center items-center bg-background">
      <div className="flex flex-col justify-center items-center">
        <svg version="1.1" className="w-24 h-24" viewBox="0 0 108 108">
          <g id="donut-back">
            <ellipse
              id="donut-back-outer"
              fill="rgba(255, 255, 255, 0)"
              stroke="#f43f5e"
              strokeWidth="2"
              strokeMiterlimit="10"
              cx="54.5"
              cy="54"
              rx="45.5"
              ry="42"
            />
            <g id="donut-back-inner">
              <circle fill="rgba(255, 255, 255, 0)" cx="57.5" cy="53.5" r="19.5" />
              <path
                fill="#f43f5e"
                d="M57.5,35C67.701,35,76,43.299,76,53.5S67.701,72,57.5,72S39,63.701,39,53.5S47.299,35,57.5,35 M57.5,33
                    C46.178,33,37,42.178,37,53.5S46.178,74,57.5,74S78,64.822,78,53.5S68.822,33,57.5,33L57.5,33z"
              />
            </g>
          </g>
          <g id="donut-front">
            <path
              fill="rgba(255, 255, 255, 0)"
              d="M51,96C27.841,96,9,77.159,9,54c0-23.159,18.841-42,42-42c23.159,0,42,18.841,42,42
                C93,77.159,74.159,96,51,96z M51,35c-10.477,0-19,8.523-19,19s8.523,19,19,19s19-8.523,19-19S61.477,35,51,35z"
            />
            <path
              fill="#f43f5e"
              d="M51,13c22.607,0,41,18.393,41,41S73.607,95,51,95S10,76.607,10,54S28.393,13,51,13 M51,74
                c11.028,0,20-8.972,20-20s-8.972-20-20-20s-20,8.972-20,20S39.972,74,51,74 M51,11C27.25,11,8,30.25,8,54s19.25,43,43,43
                s43-19.25,43-43S74.75,11,51,11L51,11z M51,72c-9.94,0-18-8.06-18-18s8.06-18,18-18s18,8.06,18,18S60.94,72,51,72L51,72z"
            />
            <g id="sprinkles" className="sprinkle-animation">
              <line
                fill="rgba(255, 255, 255, 0)"
                stroke="#ffb8d0"
                strokeWidth="2"
                strokeMiterlimit="10"
                x1="53.5"
                y1="26.5"
                x2="58.5"
                y2="19.5"
              />
              <line
                fill="rgba(255, 255, 255, 0)"
                stroke="#e11d48"
                strokeWidth="2"
                strokeMiterlimit="10"
                x1="67.991"
                y1="32.77"
                x2="76.009"
                y2="39.23"
              />
              <line
                fill="rgba(255, 255, 255, 0)"
                stroke="#2563EB"
                strokeWidth="2"
                strokeMiterlimit="10"
                x1="74.852"
                y1="65.301"
                x2="83.148"
                y2="60.699"
              />
              <line
                fill="rgba(255, 255, 255, 0)"
                stroke="#F97316"
                strokeWidth="2"
                strokeMiterlimit="10"
                x1="61.964"
                y1="77.107"
                x2="71.036"
                y2="82.393"
              />
              <line
                fill="rgba(255, 255, 255, 0)"
                stroke="#16A34A"
                strokeWidth="2"
                strokeMiterlimit="10"
                x1="42.612"
                y1="79.393"
                x2="37.612"
                y2="86.393"
              />
              <line
                fill="rgba(255, 255, 255, 0)"
                stroke="#FACC15"
                strokeWidth="2"
                strokeMiterlimit="10"
                x1="30.121"
                y1="73.123"
                x2="22.103"
                y2="66.664"
              />
              <line
                fill="rgba(255, 255, 255, 0)"
                stroke="#7C3AED"
                strokeWidth="2"
                strokeMiterlimit="10"
                x1="26.26"
                y1="46.593"
                x2="17.964"
                y2="51.194"
              />
              <line
                fill="rgba(255, 255, 255, 0)"
                stroke="#e11d48"
                strokeWidth="2"
                strokeMiterlimit="10"
                x1="37.148"
                y1="31.787"
                x2="28.076"
                y2="26.5"
              />
            </g>
          </g>
        </svg>
        <p>Preparing your Cake...</p>
      </div>
    </div>
  );
};

export default SplashScreen;
