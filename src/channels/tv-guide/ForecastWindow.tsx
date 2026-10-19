import { useCallback, useEffect, useRef, useState } from "preact/hooks";
import type { Forecast } from "../../data/types";
import { RadarMap } from "./RadarMap";
import { clockParts } from "./time";
import { compass, describeWeather, useForecast } from "./weather";
import { WeatherIcon } from "./WeatherIcon";
import styles from "./TvGuide.module.css";

const WIDTH = 160;
const HEIGHT = 88;
const FRAMES = 4;
const FRAME_MS = 90;
const PANEL = { width: 460, height: 252, cityX: 340, cityY: 132 };

/**
 * Soft, dim static drawn from a few pre-made low-resolution noise frames. It changes frames
 * only while running (active, full motion) and holds one frame otherwise.
 *
 * @param props - Whether to animate.
 * @param props.running - True while the channel is active and motion is allowed.
 * @returns The static canvas.
 */
function Static({ running }: { running: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const context = canvasRef.current?.getContext("2d");
    if (!context) return;
    const frames = Array.from({ length: FRAMES }, () => {
      const image = context.createImageData(WIDTH, HEIGHT);
      for (let index = 0; index < image.data.length; index += 4) {
        const value = 40 + Math.floor(Math.random() * 120);
        image.data[index] = value;
        image.data[index + 1] = value;
        image.data[index + 2] = value + 12;
        image.data[index + 3] = 255;
      }
      return image;
    });
    let frame = 0;
    const draw = () => {
      const image = frames[frame % FRAMES];
      if (image) context.putImageData(image, 0, 0);
      frame += 1;
    };
    draw();
    if (!running) return;
    const timer = window.setInterval(draw, FRAME_MS);
    return () => {
      window.clearInterval(timer);
    };
  }, [running]);
  return (
    <canvas
      ref={canvasRef}
      className={styles.static}
      width={WIDTH}
      height={HEIGHT}
      aria-hidden="true"
    />
  );
}

const CREDITS = [
  {
    label: "Open-Meteo.com",
    text: "Weather data by",
    url: "https://open-meteo.com/",
  },
  { label: "RainViewer", text: "Radar by", url: "https://www.rainviewer.com/" },
  { label: "DB-IP", text: "IP Geolocation by", url: "https://db-ip.com/" },
  {
    label: "Natural Earth",
    text: "Map:",
    url: "https://www.naturalearthdata.com/",
  },
];

const PRIVACY = [
  { label: "Open-Meteo privacy", url: "https://open-meteo.com/en/terms" },
  {
    label: "RainViewer privacy",
    url: "https://www.rainviewer.com/privacy.html",
  },
];

/**
 * The day name for a forecast date ("TODAY" for the first).
 *
 * @param date - YYYY-MM-DD in the city's time zone.
 * @param index - Its position in the forecast.
 * @returns The label.
 */
function dayLabel(date: string, index: number): string {
  if (index === 0) return "TODAY";
  const parsed = new Date(`${date}T12:00:00Z`);
  return new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    timeZone: "UTC",
  })
    .format(parsed)
    .toUpperCase();
}

/**
 * A spoken summary of the forecast.
 *
 * @param forecast - The forecast.
 * @returns One paragraph for screen readers.
 */
function spoken(forecast: Forecast): string {
  const { current, units, windUnit } = forecast;
  const degrees = units === "F" ? "degrees Fahrenheit" : "degrees Celsius";
  const days = forecast.daily
    .map(
      (day, index) =>
        `${dayLabel(day.date, index).toLowerCase()}: ${describeWeather(day.weatherCode).label.toLowerCase()}, high ${String(day.high)}, low ${String(day.low)}`,
    )
    .join("; ");
  return `Local forecast for ${forecast.city}: ${String(current.temperature)} ${degrees}, ${describeWeather(current.weatherCode).label.toLowerCase()}. Feels like ${String(current.feelsLike)}. Humidity ${String(current.humidity)} percent. Wind ${compass(current.windDirection)} ${String(current.windSpeed)} ${windUnit}. ${days}.`;
}

/**
 * The forecast panel over the radar map, with its credits footer and privacy note.
 *
 * @param props - The forecast and motion state.
 * @param props.forecast - The visitor's forecast.
 * @param props.active - Whether the channel is tuned in and visible.
 * @param props.reducedMotion - Hold the radar on its newest frame.
 * @returns The panel.
 */
function ForecastPanel({
  forecast,
  active,
  reducedMotion,
}: {
  forecast: Forecast;
  active: boolean;
  reducedMotion: boolean;
}) {
  const [frameTime, setFrameTime] = useState<Date | null>(null);
  const [privacy, setPrivacy] = useState(false);
  const onFrameTime = useCallback((time: Date | null) => {
    setFrameTime(time);
  }, []);
  const { current } = forecast;
  const condition = describeWeather(current.weatherCode);
  const radarClock = frameTime ? clockParts(frameTime) : null;
  return (
    <>
      <RadarMap
        latitude={forecast.latitude}
        longitude={forecast.longitude}
        city={forecast.city}
        {...PANEL}
        active={active}
        reducedMotion={reducedMotion}
        onFrameTime={onFrameTime}
      />
      <span className={styles["forecast-shade"]} aria-hidden="true" />
      <span
        className={`${styles.gold ?? ""} ${styles.heavy ?? ""} ${styles.badge ?? ""}`}
        aria-hidden="true"
      >
        LOCAL FORECAST
      </span>
      <p className={styles["sr-only"]}>{spoken(forecast)}</p>
      <div className={styles["radar-label"]} aria-hidden="true">
        <span className={styles.shadow}>
          Doppler radar
          {radarClock
            ? ` · ${radarClock.time}${radarClock.period ? ` ${radarClock.period}` : ""}`
            : ""}
        </span>
        <span className={styles.legend} />
        <span
          className={`${styles.shadow ?? ""} ${styles["legend-text"] ?? ""}`}
        >
          <span>Light</span>
          <span>Heavy</span>
        </span>
      </div>
      <div
        className={`${styles.shadow ?? ""} ${styles.now ?? ""}`}
        aria-hidden="true"
      >
        <WeatherIcon icon={condition.icon} night={!current.isDay} />
        <div>
          <div className={`${styles.heavy ?? ""} ${styles.temp ?? ""}`}>
            {current.temperature}°
          </div>
          <div className={styles.condition}>{condition.label}</div>
          <div className={styles.details}>
            Feels {current.feelsLike}° · Humidity {current.humidity}% · Wind{" "}
            {compass(current.windDirection)} {current.windSpeed}{" "}
            {forecast.windUnit}
          </div>
        </div>
      </div>
      <div className={styles.days} aria-hidden="true">
        {forecast.daily.map((day, index) => {
          const daily = describeWeather(day.weatherCode);
          return (
            <div
              key={day.date}
              className={`${styles.glass ?? ""} ${styles.day ?? ""}`}
            >
              <div
                className={`${styles.heavy ?? ""} ${styles["day-name"] ?? ""}`}
              >
                {dayLabel(day.date, index)}
              </div>
              <div
                className={`${styles.shadow ?? ""} ${styles["day-text"] ?? ""}`}
              >
                {daily.label} · {day.high}°/{day.low}°
              </div>
            </div>
          );
        })}
      </div>
      <footer className={styles.credits}>
        {CREDITS.map((credit) => (
          <span key={credit.label}>
            {credit.text}{" "}
            <a href={credit.url} target="_blank" rel="noopener noreferrer">
              {credit.label}
            </a>
          </span>
        ))}
        <button
          type="button"
          className={styles["privacy-button"]}
          aria-expanded={privacy}
          onClick={() => {
            setPrivacy((open) => !open);
          }}
        >
          Privacy
        </button>
      </footer>
      {privacy ? (
        <div className={styles.privacy} role="note">
          <p>
            Local weather uses your network address briefly to estimate your
            city. We do not save it. Our server requests forecasts and radar for
            your approximate area from Open-Meteo and RainViewer.
          </p>
          <p>
            {PRIVACY.map((link, index) => (
              <span key={link.url}>
                {index > 0 ? " · " : ""}
                <a href={link.url} target="_blank" rel="noopener noreferrer">
                  {link.label}
                </a>
              </span>
            ))}
          </p>
          <button
            type="button"
            className={styles["privacy-button"]}
            onClick={() => {
              setPrivacy(false);
            }}
          >
            Close
          </button>
        </div>
      ) : null}
    </>
  );
}

/**
 * The large window: the visitor's local forecast over live radar. While weather is
 * unavailable (Do Not Track, Save-Data, no city, a failure, or the service is off) it shows
 * soft static and never falls back to a fixed city.
 *
 * @param props - Motion state.
 * @param props.active - Whether the channel is tuned in and visible.
 * @param props.reducedMotion - Hold animations still.
 * @returns The forecast window.
 */
export function ForecastWindow({
  active,
  reducedMotion,
}: {
  active: boolean;
  reducedMotion: boolean;
}) {
  const weather = useForecast(active);
  if (weather.status === "ready")
    return (
      <ForecastPanel
        forecast={weather.forecast}
        active={active}
        reducedMotion={reducedMotion}
      />
    );
  return (
    <>
      <Static running={active && !reducedMotion} />
      <span
        className={`${styles.gold ?? ""} ${styles.heavy ?? ""} ${styles.badge ?? ""}`}
      >
        LOCAL FORECAST
      </span>
      <p className={`${styles.shadow ?? ""} ${styles.unavailable ?? ""}`}>
        {weather.status === "loading" ? "Tuning in…" : "Forecast not available"}
      </p>
    </>
  );
}
