import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Tabs, TabPane, Banner, Steps } from "@douyinfe/semi-ui";
import { IconDeleteStroked } from "@douyinfe/semi-icons";
import { db } from "../data/db";
import { useLiveQuery } from "dexie-react-hooks";
import Thumbnail from "../components/Thumbnail";
import logo_light from "../assets/logo_light_160.png";
import template_screenshot from "../assets/template_screenshot.png";

export default function Templates() {
  const { t } = useTranslation();
  const defaultTemplates = useLiveQuery(() =>
    db.templates.where({ custom: 0 }).toArray(),
  );

  const customTemplates = useLiveQuery(() =>
    db.templates.where({ custom: 1 }).toArray(),
  );

  const deleteTemplate = async (id) => {
    await db.templates.delete(id);
  };

  const forkTemplate = (id) => {
    window.open("/editor/templates/" + id, "_blank");
  };

  useEffect(() => {
    document.title = t("templates_document_title");
  }, [t]);

  return (
    <div>
      <div className="min-h-screen">
        <div className="sm:py-3 py-5 px-12 xl:px-20 sm:px-6 flex justify-between items-center select-none">
          <div className="flex items-center justify-start">
            <Link to="/">
              <img
                src={logo_light}
                alt="logo"
                className="me-2 sm:h-[28px] md:h-[46px] h-[48px]"
              />
            </Link>
            <div className="ms-4 sm:text-sm xl:text-xl text-xl font-semibold">
              {t("templates")}
            </div>
          </div>
        </div>
        <hr className="border-zinc-300" />
        <div className="xl:px-20 sm:px-6 px-12 py-6">
          <div className="w-full md:w-[75%] xl:w-[50%] mb-2">
            <div className="text-2xl sm:text-lg font-semibold mb-2 text-neutral-800">
              {t("templates_schema_title")}
            </div>
            <div className="text-sm text-neutral-700">
              {t("templates_schema_description")}
            </div>
          </div>
          <Tabs>
            <TabPane
              tab={<span className="mx-2">{t("templates_default")}</span>}
              itemKey="1"
            >
              <div className="grid xl:grid-cols-3 grid-cols-2 sm:grid-cols-1 gap-10 my-6">
                {defaultTemplates?.map((template, i) => (
                  <div
                    key={template.id}
                    className="bg-gray-100 hover:translate-y-[-6px] transition-all duration-300 border rounded-md"
                  >
                    <div className="h-48">
                      <Thumbnail
                        diagram={template}
                        i={"1" + i}
                        zoom={0.3}
                        theme="light"
                      />
                    </div>
                    <div className="px-4 py-3">
                      <div className="flex justify-between">
                        <div className="text-lg font-bold text-zinc-700">
                          {template.title}
                        </div>
                        <button
                          aria-label={t("templates_fork_template", {
                            title: template.title,
                          })}
                          className="border rounded-sm px-2 py-1 bg-white hover:bg-gray-200 transition-all duration-300"
                          onClick={() => forkTemplate(template.templateId)}
                        >
                          <i className="bi bi-diagram-3"></i>
                        </button>
                      </div>
                      <div>{template.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            </TabPane>
            <TabPane
              tab={<span className="mx-2">{t("templates_your")}</span>}
              itemKey="2"
            >
              {customTemplates?.length > 0 ? (
                <div className="grid xl:grid-cols-3 grid-cols-2 sm:grid-cols-1 gap-8 my-6">
                  {customTemplates?.map((c, i) => (
                    <div
                      key={c.id}
                      className="bg-gray-100 hover:translate-y-[-6px] transition-all duration-300 border rounded-md"
                    >
                      <div className="h-48">
                        <Thumbnail diagram={c} i={"2" + i} zoom={0.3} />
                      </div>
                      <div className="px-4 py-3 w-full">
                        <div className="flex justify-between">
                          <div className="text-lg font-bold text-zinc-700">
                            {c.title}
                          </div>
                          <div>
                            <button
                              aria-label={t("templates_fork_template", {
                                title: c.title,
                              })}
                              className="me-1 border rounded-sm px-2 py-1 bg-white hover:bg-gray-200 transition-all duration-300"
                              onClick={() => forkTemplate(c.templateId)}
                            >
                              <i className="bi bi-diagram-3"></i>
                            </button>
                          </div>
                        </div>
                        <div className="flex justify-around mt-2">
                          <button
                            className="w-full text-center flex justify-center items-center border rounded-sm px-2 py-1 bg-white hover:bg-gray-200 transition-all duration-300 text-red-500"
                            onClick={() => deleteTemplate(c.id)}
                          >
                            <IconDeleteStroked />
                            <div className="ms-1.5 font-semibold">
                              {t("delete")}
                            </div>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-5">
                  <Banner
                    fullMode={false}
                    type="info"
                    bordered
                    icon={null}
                    closeIcon={null}
                    description={<div>{t("templates_no_custom")}</div>}
                  />
                  <div className="grid grid-cols-5 sm:grid-cols-1 gap-4 place-content-center my-4">
                    <img
                      src={template_screenshot}
                      alt={t("templates_save_screenshot_alt")}
                      className="border col-span-3 sm:cols-span-1 rounded-sm"
                    />
                    <div className="col-span-2 sm:cols-span-1">
                      <div className="text-xl font-bold my-4">
                        {t("templates_how_to_save")}
                      </div>
                      <Steps direction="vertical" style={{ margin: "12px" }}>
                        <Steps.Step
                          title={t("templates_step_build_title")}
                          description={t("templates_step_build_description")}
                        />
                        <Steps.Step
                          title={t("templates_step_save_title")}
                          description={t("templates_step_save_description")}
                        />
                        <Steps.Step
                          title={t("templates_step_load_title")}
                          description={t("templates_step_load_description")}
                        />
                      </Steps>
                    </div>
                  </div>
                </div>
              )}
            </TabPane>
          </Tabs>
        </div>
      </div>
      <hr className="border-zinc-300 my-1" />
      <div className="text-center text-sm py-3">
        &copy; {new Date().getFullYear()} <strong>drawDB</strong> - All rights
        {t("landing_rights_reserved")}
      </div>
    </div>
  );
}
