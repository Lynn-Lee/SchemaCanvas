import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import SimpleCanvas from "../components/SimpleCanvas";
import Navbar from "../components/Navbar";
import { diagram } from "../data/heroDiagram";
import mysql_icon from "../assets/mysql.png";
import postgres_icon from "../assets/postgres.png";
import sqlite_icon from "../assets/sqlite.png";
import mariadb_icon from "../assets/mariadb.png";
import oraclesql_icon from "../assets/oraclesql.png";
import sql_server_icon from "../assets/sql-server.png";
import discord from "../assets/discord.png";
import github from "../assets/github.png";
import warp from "../assets/warp.png";
import screenshot from "../assets/screenshot.png";
import FadeIn from "../animations/FadeIn";
import axios from "axios";
import { languages } from "../i18n/i18n";
import { socials } from "../data/socials";

function shortenNumber(number) {
  if (number < 1000) return number;

  if (number >= 1000 && number < 1_000_000)
    return `${(number / 1000).toFixed(1)}k`;
}

export default function LandingPage() {
  const { t } = useTranslation();
  const [stats, setStats] = useState({ stars: 18000, forks: 1200 });
  const features = getFeatures(t);

  useEffect(() => {
    const fetchStats = async () => {
      await axios
        .get("https://api.github-star-counter.workers.dev/user/drawdb-io")
        .then((res) => setStats(res.data));
    };

    document.body.setAttribute("theme-mode", "light");
    document.title = t("landing_document_title");

    fetchStats();
  }, [t]);

  return (
    <div>
      <div className="flex flex-col h-screen bg-zinc-100">
        <div className="text-white font-semibold py-1 text-sm text-center bg-linear-to-r from-[#12495e] from-10% via-slate-500 to-[#12495e]" />

        <FadeIn duration={0.6}>
          <Navbar />
        </FadeIn>

        {/* Hero section */}
        <div className="flex-1 flex-col relative mx-4 md:mx-0 mb-4 rounded-3xl bg-white">
          <div className="h-full md:hidden">
            <SimpleCanvas diagram={diagram} zoom={0.85} />
          </div>
          <div className="hidden md:block h-full bg-dots" />
          <div className="absolute left-12 w-[45%] top-[50%] translate-y-[-54%] md:left-[50%] md:translate-x-[-50%] p-8 md:p-3 md:w-full text-zinc-800">
            <FadeIn duration={0.75}>
              <div className="md:px-3">
                <h1 className="text-[42px] md:text-3xl font-bold tracking-wide bg-linear-to-r from-sky-900 from-10% via-slate-500 to-[#12495e] inline-block text-transparent bg-clip-text">
                  {t("landing_hero_title")}
                </h1>
                <div className="text-lg font-medium mt-1 sliding-vertical">
                  {t("landing_hero_description")}{" "}
                  <span className="ms-2 sm:block sm:ms-0 text-slate-500 bg-white font-bold whitespace-nowrap">
                    {t("landing_hero_no_signup")}
                  </span>
                  <span className="ms-2 sm:block sm:ms-0 text-slate-500 bg-white font-bold whitespace-nowrap">
                    {t("landing_hero_free")}
                  </span>
                  <span className="ms-2 sm:block sm:ms-0 text-slate-500 bg-white font-bold whitespace-nowrap">
                    {t("landing_hero_quick")}
                  </span>
                </div>
              </div>
            </FadeIn>
            <div className="mt-4 font-semibold md:mt-12">
              <button
                className="py-3 mb-4 xl:mb-0 mr-4 transition-all duration-300 bg-white border rounded-full shadow-lg px-9 border-zinc-200 hover:bg-zinc-100 cursor-pointer"
                onClick={() =>
                  document
                    .getElementById("learn-more")
                    .scrollIntoView({ behavior: "smooth" })
                }
              >
                {t("landing_learn_more")}
              </button>
              <Link
                to="/editor"
                className="inline-block py-3 text-white transition-all duration-300 rounded-full shadow-lg bg-sky-900 ps-7 pe-6 hover:bg-sky-800"
              >
                {t("landing_try_it")} <i className="bi bi-arrow-right ms-1"></i>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Learn more */}
      <div id="learn-more">
        <div className="bg-zinc-100 py-10 px-28 md:px-8">
          {/* Supported by */}
          <div className="text-center mb-16">
            <div className="text-2xl md:text-xl font-bold text-sky-800 mb-8">
              {t("landing_supported_by")}
            </div>
            <div>
              <a
                href="https://warp.dev/drawdb"
                target="_blank"
                rel="noreferrer"
              >
                <img
                  src={warp}
                  alt="warp.dev"
                  width={260}
                  className="m-auto mb-4"
                />
                <div className="font-semibold text-lg md:text-base">
                  {t("landing_warp_description")}
                </div>
              </a>
            </div>
          </div>
          <div className="mt-16 w-[75%] text-center sm:w-full mx-auto shadow-xs rounded-2xl border p-6 bg-white space-y-3 mb-12">
            <div className="text-lg font-medium">
              {t("landing_product_summary")}
            </div>
            <img
              src={screenshot}
              alt={t("landing_screenshot_alt")}
              className="mx-auto"
            />
          </div>
          <div className="flex justify-center items-center gap-28 md:block">
            <div className="text-center mb-4">
              <div className="text-5xl md:text-3xl font-bold text-sky-800">
                {shortenNumber(stats.stars)}
              </div>
              <div className="ms-1 mt-1 font-medium tracking-wide">
                {t("landing_github_stars")}
              </div>
            </div>
            <div className="text-center mb-4">
              <div className="text-5xl md:text-3xl font-bold text-sky-800">
                {shortenNumber(stats.forks)}
              </div>
              <div className="ms-1 mt-1 font-medium tracking-wide">
                {t("landing_github_forks")}
              </div>
            </div>
            <div className="text-center mb-4">
              <div className="text-5xl md:text-3xl font-bold text-sky-800">
                {shortenNumber(languages.length)}
              </div>
              <div className="ms-1 mt-1 font-medium tracking-wide">
                {t("landing_languages")}
              </div>
            </div>
          </div>
          <div className="text-lg font-medium text-center mt-12 mb-6">
            {t("landing_design_for_database")}
          </div>
          <div className="grid grid-cols-3 place-items-center sm:grid-cols-1 sm:gap-10">
            {dbs.map((s, i) => (
              <img
                key={"icon-" + i}
                src={s.icon}
                alt={s.name}
                style={{ height: s.height }}
                className="opacity-70 hover:opacity-100 transition-opacity duration-300 md:scale-[0.7] md:mx-auto"
              />
            ))}
          </div>
        </div>
        <svg
          viewBox="0 0 1440 54"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          width="100%"
          className="bg-transparent"
        >
          <path
            d="M0 54C0 54 320 0 720 0C1080 0 1440 54 1440 54V0H0V100Z"
            fill="#f4f4f5"
          />
        </svg>
      </div>

      {/* Features */}
      <div id="features" className="py-8 px-36 md:px-8">
        <FadeIn duration={1}>
          <div className="text-base font-medium text-center text-sky-900">
            {t("landing_features_eyebrow")}
          </div>
          <div className="text-2xl mt-1 font-medium text-center">
            {t("landing_features_title")}
          </div>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,18rem),1fr))] gap-8 mt-10">
            {features.map((f, i) => (
              <div
                key={"feature" + i}
                className="flex rounded-xl hover:bg-zinc-100 border border-zinc-100 shadow-xs hover:-translate-y-2 transition-all duration-300"
              >
                <div className="bg-sky-700 px-0.5 rounded-l-xl" />
                <div className="px-8 py-4 ">
                  <div className="text-lg font-semibold mb-3">{f.title}</div>
                  {f.content}
                  <div className="mt-2 text-xs opacity-60">{f.footer}</div>
                </div>
              </div>
            ))}
          </div>
        </FadeIn>
      </div>

      {/* Tweets */}
      <div className="px-40 mt-6 md:px-8">
        <div className="text-center text-2xl md:text-xl font-medium">
          {t("landing_social_title")}
        </div>
        <LandingTweets t={t} />
      </div>

      {/* Contact us */}
      <svg
        viewBox="0 0 1440 54"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        width="100%"
        className="bg-transparent -scale-100"
      >
        <path
          d="M0 48 C0 48 320 0 720 0C1080 0 1440 48 1440 48V0H0V100Z"
          fill="#f4f4f5"
        />
      </svg>
      <div className="bg-zinc-100 py-8 px-32 md:px-8">
        <div className="mt-4 mb-2 text-2xl font-bold text-center">
          {t("landing_contact_title")}
        </div>
        <div className="text-lg text-center mb-4">
          {t("landing_contact_description")}
        </div>
        <div className="px-36 text-center md:px-8">
          <div className="md:block md:space-y-3 flex gap-3 justify-center">
            <a
              className="inline-block"
              href={socials.github}
              target="_blank"
              rel="noreferrer"
            >
              <div className="bg-zinc-800 hover:opacity-90 transition-all duration-300 flex items-center gap-4 px-14 py-4 rounded-lg">
                <img src={github} alt="" className="h-8" />
                <div className="text-lg text-white font-bold">
                  {t("landing_source")}
                </div>
              </div>
            </a>
            <a
              className="inline-block"
              href={socials.discord}
              target="_blank"
              rel="noreferrer"
            >
              <div className="bg-[#5865f2] hover:opacity-90 transition-all duration-300 flex items-center gap-4 px-8 py-4 rounded-lg">
                <img src={discord} alt="" className="h-8" />
                <div className="text-lg text-white font-bold">
                  {t("landing_join_discord")}
                </div>
              </div>
            </a>
            <a
              className="inline-block"
              href={socials.twitter}
              target="_blank"
              rel="noreferrer"
            >
              <div className="text-white bg-zinc-800 hover:opacity-90 transition-all duration-300 flex items-center gap-4 px-12 py-4 rounded-lg">
                <i className="text-2xl bi bi-twitter-x" />
                <div className="text-lg  font-bold">{t("landing_follow_x")}</div>
              </div>
            </a>
          </div>
          <div className="px-30 md:px-8 text-center mt-4">
            <a
              className="w-full"
              href={socials.sponsor}
              target="_blank"
              rel="noreferrer"
            >
              <div className="bg-white border-2 border-rose-400 hover:opacity-90 transition-all duration-300 flex items-center justify-center gap-4 px-12 py-3 rounded-full">
                <div className="relative text-2xl mt-1">
                  <i className="bi bi-heart-fill text-rose-300" />
                  <i className="absolute top-0.5 left-0 bi bi-heart text-rose-400" />
                </div>
                <div className="text-xl font-semibold">{t("landing_support_us")}</div>
              </div>
            </a>
          </div>
        </div>
      </div>

      <div className="bg-red-700 py-1 text-center text-white text-xs font-semibold px-3">
        {t("landing_browser_storage_warning")}
      </div>
      <hr className="border-zinc-300" />
      <div className="text-center text-sm py-3">
        &copy; {new Date().getFullYear()} <strong>drawDB</strong> - All rights
        {t("landing_rights_reserved")}
      </div>
    </div>
  );
}

const tweetIds = [
  "1816111365125218343",
  "1817933406337905021",
  "1785457354777006524",
  "1776842268042756248",
];

function LandingTweets({ t }) {
  const containerRef = useRef(null);
  const [shouldLoadTweets, setShouldLoadTweets] = useState(false);
  const [TweetComponent, setTweetComponent] = useState(null);
  const [tweetLoadError, setTweetLoadError] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;

    if (!("IntersectionObserver" in window)) {
      setShouldLoadTweets(true);
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShouldLoadTweets(true);
          observer.disconnect();
        }
      },
      { rootMargin: "160px 0px" },
    );

    observer.observe(container);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!shouldLoadTweets || TweetComponent) return undefined;

    let active = true;
    import("react-tweet")
      .then((module) => {
        if (active) setTweetComponent(() => module.Tweet);
      })
      .catch(() => {
        if (active) setTweetLoadError(true);
      });

    return () => {
      active = false;
    };
  }, [shouldLoadTweets, TweetComponent]);

  return (
    <div
      ref={containerRef}
      data-theme="light"
      className="grid grid-cols-2 place-items-center md:grid-cols-1 min-h-[420px]"
    >
      {!TweetComponent ? (
        <div
          data-testid="landing-social-placeholder"
          className="col-span-2 md:col-span-1 w-full rounded-xl border border-zinc-200 bg-white p-8 text-center text-sm font-medium text-zinc-500"
        >
          {tweetLoadError
            ? t("landing_social_load_error")
            : t("landing_social_loading")}
        </div>
      ) : (
        tweetIds.map((id) => (
          <div data-testid="landing-social-widget" key={id}>
            <TweetComponent id={id} />
          </div>
        ))
      )}
    </div>
  );
}

const dbs = [
  { name: "MySQL", icon: mysql_icon, height: 80 },
  { name: "PostgreSQL", icon: postgres_icon, height: 48 },
  { name: "SQLite", icon: sqlite_icon, height: 64 },
  { name: "MariaDB", icon: mariadb_icon, height: 64 },
  { name: "SQL Server", icon: sql_server_icon, height: 64 },
  { name: "Oracle SQL", icon: oraclesql_icon, height: 172 },
];

function getFeatures(t) {
  return [
  {
    title: t("landing_feature_export_title"),
    content: (
      <div>
        {t("landing_feature_export_body")}
      </div>
    ),
    footer: "",
  },
  {
    title: t("landing_feature_reverse_title"),
    content: (
      <div>
        {t("landing_feature_reverse_body")}
      </div>
    ),
    footer: "",
  },
  {
    title: t("landing_feature_migrations_title"),
    content: (
      <div>
        {t("landing_feature_migrations_body")}
      </div>
    ),
    footer: "",
  },
  {
    title: t("landing_feature_workspace_title"),
    content: (
      <div>
        {t("landing_feature_workspace_body")}
      </div>
    ),
    footer: "",
  },
  {
    title: t("landing_feature_shortcuts_title"),
    content: (
      <div>
        {t("landing_feature_shortcuts_body")}{" "}
        <Link
          to={`${socials.docs}/shortcuts`}
          className="ms-1.5 text-blue-500 hover:underline"
        >
          {t("landing_feature_shortcuts_link")}
        </Link>
        .
      </div>
    ),
    footer: "",
  },
  {
    title: t("landing_feature_templates_title"),
    content: (
      <div>
        {t("landing_feature_templates_body")}
      </div>
    ),
    footer: "",
  },
  {
    title: t("landing_feature_custom_templates_title"),
    content: (
      <div>
        {t("landing_feature_custom_templates_body")}
      </div>
    ),
    footer: "",
  },
  {
    title: t("landing_feature_editor_title"),
    content: (
      <div>
        {t("landing_feature_editor_body")}
      </div>
    ),
    footer: "",
  },
  {
    title: t("landing_feature_issues_title"),
    content: (
      <div>
        {t("landing_feature_issues_body")}
      </div>
    ),
    footer: "",
  },
  {
    title: t("landing_feature_relational_title"),
    content: (
      <div>
        {t("landing_feature_relational_body")}
      </div>
    ),
    footer: "",
  },
  {
    title: t("landing_feature_object_relational_title"),
    content: (
      <div>
        {t("landing_feature_object_relational_body")}
      </div>
    ),
    footer: "",
  },
  {
    title: t("landing_feature_presentation_title"),
    content: (
      <div>
        {t("landing_feature_presentation_body")}
      </div>
    ),
    footer: "",
  },
  ];
}
