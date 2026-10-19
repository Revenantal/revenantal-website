import { groupCredits } from "@data/credits";
import type { DataView } from "@data/freshness";
import type { Site } from "@data/types";
import { useEffect, useRef } from "preact/hooks";
import { CopyButton } from "./CopyButton";
import { SourceAge } from "./SourceAge";
import styles from "./ListView.module.css";

/** The directory receives only shared content and freshness-filtered observations. */
export type ListViewProps = {
  site: Site;
  view: DataView;
  now: Date;
  /** Turns the TV on; the button shows only where the TV can render. */
  onTurnOn?: () => void;
  /** Move focus to the heading on arrival, for example after turning the TV off. */
  focusOnMount?: boolean;
};

/**
 * Renders the complete directory at every viewport before the TV shell exists.
 *
 * @param props - Shared content, sanitized observations and the viewer clock.
 * @param props.site - Validated static content.
 * @param props.view - Shared freshness-filtered data.
 * @param props.now - The shared viewer clock.
 * @param props.onTurnOn - Turns the TV on, when the window can show it.
 * @param props.focusOnMount - Whether to focus the heading on arrival.
 * @returns Projects, public servers, profiles and shared credits in semantic order.
 */
export function ListView({
  site,
  view,
  now,
  onTurnOn,
  focusOnMount = false,
}: ListViewProps) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    if (focusOnMount) headingRef.current?.focus();
  }, [focusOnMount]);
  const steam = view.live?.steam;
  const latest = view.live?.github?.repos[0];
  const snapshotTime = view.live?.fetchedAt;
  const validSnapshotTime =
    snapshotTime && Date.parse(snapshotTime) <= now.getTime();
  return (
    <>
      <a className={styles.skip} href="#projects">
        Skip to projects
      </a>
      <main className={styles.directory}>
        <header className={styles.header}>
          <p className={styles.model}>SOLID STATE · MODEL RV-404</p>
          <h1 className={styles.wordmark} ref={headingRef} tabIndex={-1}>
            REVENANTAL
          </h1>
          <p className={styles.intro}>
            Projects, tools and a few things to play.
          </p>
          {onTurnOn ? (
            <button
              type="button"
              className={styles["turn-on"]}
              onClick={onTurnOn}
            >
              <span className={styles.led} aria-hidden="true" />
              Turn on the TV
            </button>
          ) : null}
        </header>

        <section className={styles.section} aria-labelledby="right-now-title">
          <h2 id="right-now-title">Right now</h2>
          <div className={styles.card}>
            <h3>Steam</h3>
            <p>
              {steam
                ? steam.status === "in-game"
                  ? "In game"
                  : steam.status
                : "No current observation."}
            </p>
            <SourceAge source={view.freshness.steam} now={now} />
          </div>
          <div className={styles.card}>
            <h3>Latest push</h3>
            {latest ? (
              <a href={latest.url} target="_blank" rel="noopener noreferrer">
                {latest.name}
                <span className={styles["sr-only"]}> (opens in a new tab)</span>
              </a>
            ) : (
              <p>No current observation.</p>
            )}
            <SourceAge source={view.freshness.github} now={now} />
          </div>
        </section>

        <section className={styles.section} aria-labelledby="projects">
          <h2 id="projects" tabIndex={-1}>
            Projects
          </h2>
          {site.directory?.source === "github" ? (
            <SourceAge
              source={view.freshness.github}
              now={now}
              label="Repositories"
            />
          ) : null}
          <SourceAge
            source={view.freshness.status}
            now={now}
            label="Availability"
          />
          {view.projects.length === 0 ? (
            <p className={styles.empty}>Nothing on the listings yet.</p>
          ) : (
            <ul className={styles.list}>
              {view.projects.map((project) => (
                <li key={project.id}>
                  <a
                    className={styles.project}
                    href={project.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <div className={styles["project-heading"]}>
                      <h3>{project.name}</h3>
                      <span
                        className={styles.status}
                        data-state={project.status ?? "unknown"}
                      >
                        {project.status ?? "unknown"}
                      </span>
                    </div>
                    <p>{project.desc}</p>
                    <p className={styles.meta}>
                      {project.host} · {project.type}
                      <span className={styles["sr-only"]}>
                        {" "}
                        · opens in a new tab
                      </span>
                    </p>
                  </a>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className={styles.section} aria-labelledby="servers">
          <h2 id="servers" tabIndex={-1}>
            Game servers
          </h2>
          <SourceAge source={view.freshness.servers} now={now} />
          {view.servers.length === 0 ? (
            <p className={styles.empty}>No server observations available.</p>
          ) : (
            <ul className={styles.list}>
              {view.servers.map((server) => (
                <li className={styles.card} key={server.id}>
                  <div className={styles["project-heading"]}>
                    <h3>{server.name}</h3>
                    <span className={styles.status} data-state={server.state}>
                      {server.state}
                    </span>
                  </div>
                  <p>
                    {server.game}
                    {server.players !== undefined
                      ? ` · ${String(server.players)}${server.maxPlayers !== undefined ? `/${String(server.maxPlayers)}` : ""} players`
                      : ""}
                  </p>
                  {server.address ? (
                    <CopyButton
                      label={`Address for ${server.name}`}
                      value={server.address}
                    />
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className={styles.section} aria-labelledby="profiles-title">
          <h2 id="profiles-title">Elsewhere</h2>
          <div className={styles.profiles}>
            {site.buttons
              .filter(
                (button) =>
                  button.action !== "tune" || button.channel === "status",
              )
              .map((button) =>
                button.action === "tune" ? (
                  <a
                    className={styles.button}
                    href="#servers"
                    key={button.label}
                  >
                    {button.label}
                  </a>
                ) : button.href ? (
                  <a
                    className={styles.button}
                    href={button.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    key={button.label}
                  >
                    {button.label}
                    <span className={styles["sr-only"]}>
                      {" "}
                      (opens in a new tab)
                    </span>
                  </a>
                ) : button.action === "copy" && button.copyValue ? (
                  <CopyButton
                    key={button.label}
                    label={button.label}
                    value={button.copyValue}
                    copiedLabel={button.copiedLabel}
                  />
                ) : null,
              )}
          </div>
        </section>

        <section className={styles.section} aria-labelledby="pushes-title">
          <h2 id="pushes-title">Recent pushes</h2>
          <SourceAge source={view.freshness.github} now={now} />
          {view.live?.github?.repos.length ? (
            <ul className={styles.list}>
              {view.live.github.repos.slice(0, 5).map((repo) => (
                <li key={repo.url}>
                  <a
                    className={styles.repo}
                    href={repo.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <span>
                      {repo.name}
                      <span className={styles["sr-only"]}>
                        {" "}
                        (opens in a new tab)
                      </span>
                    </span>
                    <time dateTime={repo.pushedAt}>
                      {new Date(repo.pushedAt).toLocaleDateString()}
                    </time>
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <p className={styles.empty}>No recent observations available.</p>
          )}
        </section>

        <footer className={styles.footer}>
          <details>
            <summary className={styles.summary}>Credits</summary>
            {groupCredits(site.credits).map((group) => (
              <section
                key={group.department}
                className={styles.department}
                aria-label={group.department}
              >
                <h3>{group.department}</h3>
                <ul className={styles.list}>
                  {group.credits.map((credit) => (
                    <li
                      className={styles.credit}
                      key={`${credit.title}-${credit.url}`}
                    >
                      <a
                        href={credit.url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {credit.title}
                        <span className={styles["sr-only"]}>
                          {" "}
                          (opens in a new tab)
                        </span>
                      </a>
                      <p>
                        {credit.author} · {credit.license}
                      </p>
                      <p className={styles.meta}>
                        {credit.usedFor}
                        {credit.edits ? ` · ${credit.edits}` : ""}
                      </p>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </details>
          <p className={styles.meta}>
            {validSnapshotTime ? (
              <>
                Snapshot written{" "}
                <time dateTime={snapshotTime}>
                  {new Date(snapshotTime).toLocaleString()}
                </time>
              </>
            ) : (
              "No snapshot time available."
            )}
          </p>
        </footer>
      </main>
    </>
  );
}
