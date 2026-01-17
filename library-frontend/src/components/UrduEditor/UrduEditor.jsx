// src/components/UrduEditor/UrduEditor.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  Undo,
  Redo,
  Image as ImageIcon,
  Link as LinkIcon,
  Search,
  Eraser,
  X,
  Scissors,
  FileText,
  HelpCircle,
  Sidebar as SidebarIcon,
  ZoomIn,
  ZoomOut,
  Heading1,
  Heading2,
  Heading3,
  Settings,
} from "lucide-react";

import { A4_WIDTH_PX, A4_HEIGHT_PX, FONTS, FONT_SIZES } from "./config";
import { ToolbarButton, ToolbarSeparator, MenuDropdown } from "./UIHelpers";
import Ruler from "./Ruler";
import PageSetupModal from "./PageSetupModal";
import "./styles.css";

export default function UrduEditor() {
  const editorRef = useRef(null);
  const workspaceRef = useRef(null);

  const isPaginatingRef = useRef(false);
  const pasteRunningRef = useRef(false);
  const rafPaginateRef = useRef(null);

  // pages store HTML per page
  const [pages, setPages] = useState(["<p><br/></p>"]);
  const [activePageIndex, setActivePageIndex] = useState(0);

  const [activeFormats, setActiveFormats] = useState([]);
  const [fontName, setFontName] = useState("Arial");
  const [fontSize, setFontSize] = useState("3");
  const [zoom, setZoom] = useState(100);
  const [isRTL, setIsRTL] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const [navHeadings, setNavHeadings] = useState([]);
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);

  const [isPageSetupOpen, setIsPageSetupOpen] = useState(false);

  const [pageSettings, setPageSettings] = useState({
    size: "a4",
    orientation: "portrait",
    margins: { top: 2.54, bottom: 2.54, left: 2.54, right: 2.54 }, // cm
    bgColor: "#ffffff",
  });

  // ----------------------------
  // Helpers
  // ----------------------------
  const cmToPx = (cm) => cm * 37.8;

  const paddingTopPx = cmToPx(pageSettings.margins.top);
  const paddingBottomPx = cmToPx(pageSettings.margins.bottom);
  const paddingLeftPx = cmToPx(pageSettings.margins.left);
  const paddingRightPx = cmToPx(pageSettings.margins.right);

  const writableHeightPx = useMemo(() => {
    const top = paddingTopPx;
    const bottom = paddingBottomPx;
    // inside A4 page height
    return A4_HEIGHT_PX - (top + bottom);
  }, [paddingTopPx, paddingBottomPx]);

  const execCmd = (command, value = null) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    checkActiveFormats();
    schedulePagination();
  };

  const handleHeading = (tag) => execCmd("formatBlock", tag);

  const saveCurrentPage = () => {
    if (!editorRef.current) return;
    const html = editorRef.current.innerHTML || "<p><br/></p>";
    setPages((prev) => {
      const copy = [...prev];
      copy[activePageIndex] = html;
      return copy;
    });
  };

  // ----------------------------
  // Load active page into editor
  // ----------------------------
  useEffect(() => {
    if (!editorRef.current) return;
    editorRef.current.innerHTML = pages[activePageIndex] || "<p><br/></p>";

    // focus + update counts
    setTimeout(() => {
      editorRef.current?.focus();
      updateCounts();
      parseHeadings();
    }, 10);
    // eslint-disable-next-line
  }, [activePageIndex]);

  // ----------------------------
  // Autosave
  // ----------------------------
  useEffect(() => {
    const saved = localStorage.getItem("urdu_pro_editor_pages");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setPages(parsed);
          setActivePageIndex(0);
        }
      } catch (e) {
        console.log("Autosave parse error:", e);
      }
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      localStorage.setItem("urdu_pro_editor_pages", JSON.stringify(pages));
    }, 15000);
    return () => clearInterval(interval);
  }, [pages]);

  // ----------------------------
  // Counts + formats
  // ----------------------------
  const updateCounts = () => {
    if (!editorRef.current) return;
    const text = editorRef.current.innerText || "";
    setWordCount(text.trim() ? text.trim().split(/\s+/).length : 0);
    setCharCount(text.length);
  };

  const checkActiveFormats = () => {
    const formats = [
      "bold",
      "italic",
      "underline",
      "strikethrough",
      "justifyLeft",
      "justifyCenter",
      "justifyRight",
      "justifyFull",
      "insertUnorderedList",
      "insertOrderedList",
    ];

    const active = formats.filter((cmd) => document.queryCommandState(cmd));
    setActiveFormats(active);

    const fName = document.queryCommandValue("fontName");
    if (fName) setFontName(fName.replace(/['"]+/g, ""));

    const fSize = document.queryCommandValue("fontSize");
    if (fSize) setFontSize(fSize);
  };

  const parseHeadings = () => {
    if (!editorRef.current) return;
    const headings = [];
    const elements = editorRef.current.querySelectorAll("h1, h2, h3");
    elements.forEach((el, index) => {
      if (!el.id) el.id = `heading-${activePageIndex}-${index}`;
      headings.push({
        id: el.id,
        text: el.innerText,
        tag: el.tagName.toLowerCase(),
        level: el.tagName === "H1" ? 0 : el.tagName === "H2" ? 1 : 2,
      });
    });
    setNavHeadings(headings);
  };

  const scrollToHeading = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      const originalBg = el.style.backgroundColor;
      el.style.backgroundColor = "#fffec8";
      setTimeout(() => (el.style.backgroundColor = originalBg), 1000);
    }
  };

  // ----------------------------
  // Download / Print
  // ----------------------------
  const handlePrint = () => window.print();

  const handleDownload = (format) => {
    const filename = `document.${format}`;

    if (format === "html") {
      const fullHtml = pages
        .map((p) => `<div style="page-break-after:always">${p}</div>`)
        .join("\n");

      const blob = new Blob([fullHtml], { type: "text/html" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      link.click();
      return;
    }

    const temp = document.createElement("div");
    temp.innerHTML = pages.join("<br/><br/>");
    const data = temp.innerText;

    const blob = new Blob([data], { type: "text/plain" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
  };

  // ----------------------------
  // Page navigation
  // ----------------------------
  const goNextPage = () => {
    saveCurrentPage();
    setPages((prev) => {
      const copy = [...prev];
      if (!copy[activePageIndex + 1]) copy.push("<p><br/></p>");
      return copy;
    });
    setActivePageIndex((p) => p + 1);
  };

  const goPrevPage = () => {
    saveCurrentPage();
    if (activePageIndex > 0) setActivePageIndex((p) => p - 1);
  };

  const insertPageBreak = () => {
    goNextPage();
  };

  // ----------------------------
  // Pagination Engine (MS Word Like)
  // ----------------------------
  const getOverflowAmount = () => {
    if (!editorRef.current) return 0;
    // scrollHeight tells how tall content wants to be
    return editorRef.current.scrollHeight - writableHeightPx;
  };

  const moveOverflowToNextPage = () => {
    if (!editorRef.current) return false;

    const overflow = getOverflowAmount();
    if (overflow <= 5) return false;

    // ensure next page exists
    setPages((prev) => {
      const copy = [...prev];
      if (!copy[activePageIndex + 1]) copy.push("<p><br/></p>");
      return copy;
    });

    // We will remove nodes from end until it fits
    const editor = editorRef.current;

    // If empty or only <br>, stop
    if (!editor.lastChild) return false;

    const removedNodes = [];

    // remove blocks from end
    while (editor.lastChild && getOverflowAmount() > 5) {
      removedNodes.unshift(editor.lastChild);
      editor.removeChild(editor.lastChild);
    }

    // If nothing removed, stop
    if (removedNodes.length === 0) return false;

    // Save current page HTML now
    const currentHtml = editor.innerHTML || "<p><br/></p>";

    // Prepare overflow HTML
    const temp = document.createElement("div");
    removedNodes.forEach((n) => temp.appendChild(n));
    const overflowHtml = temp.innerHTML || "<p><br/></p>";

    // Push overflow to next page at start
    setPages((prev) => {
      const copy = [...prev];
      copy[activePageIndex] = currentHtml;

      const nextHtml = copy[activePageIndex + 1] || "<p><br/></p>";
      copy[activePageIndex + 1] = overflowHtml + nextHtml;

      return copy;
    });

    return true;
  };

  const paginateForward = () => {
    if (isPaginatingRef.current) return;
    if (!editorRef.current) return;

    isPaginatingRef.current = true;

    // Try multiple times (large paste)
    let loops = 0;
    while (loops < 50) {
      const moved = moveOverflowToNextPage();
      if (!moved) break;
      loops += 1;
    }

    updateCounts();
    parseHeadings();

    isPaginatingRef.current = false;
  };

  const schedulePagination = () => {
    // Save page quickly
    saveCurrentPage();
    updateCounts();

    if (rafPaginateRef.current) cancelAnimationFrame(rafPaginateRef.current);
    rafPaginateRef.current = requestAnimationFrame(() => {
      paginateForward();
    });
  };

  // ----------------------------
  // Fast paste (Chunk insert)
  // ----------------------------
  const handlePasteFast = (e) => {
    e.preventDefault();
    if (!editorRef.current) return;

    const text = e.clipboardData.getData("text/plain");
    if (!text) return;

    pasteRunningRef.current = true;

    const lines = text.split("\n");
    const CHUNK_SIZE = 80;
    let i = 0;

    const insertChunk = () => {
      const chunk = lines.slice(i, i + CHUNK_SIZE);
      if (!chunk.length) {
        pasteRunningRef.current = false;
        schedulePagination();
        return;
      }

      const safeHTML = chunk
        .join("\n")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\n{2,}/g, "</p><p>")
        .replace(/\n/g, "<br/>");

      document.execCommand("insertHTML", false, `<p>${safeHTML}</p>`);

      i += CHUNK_SIZE;

      requestAnimationFrame(insertChunk);
    };

    requestAnimationFrame(insertChunk);
  };

  // ----------------------------
  // Input handler
  // ----------------------------
  const handleInput = () => {
    // Do not paginate on every keystroke when paste running
    if (pasteRunningRef.current) return;
    schedulePagination();
  };

  // ----------------------------
  // Workspace scroll -> active page detection
  // ----------------------------
  const handleWorkspaceScrollSimple = () => {
    if (!workspaceRef.current) return;

    const container = workspaceRef.current;
    const containerRect = container.getBoundingClientRect();
    const centerY = containerRect.top + containerRect.height / 2;

    const pageNodes = container.querySelectorAll("[data-page-index]");
    if (!pageNodes.length) return;

    let closestIndex = activePageIndex;
    let closestDistance = Infinity;

    pageNodes.forEach((node) => {
      const rect = node.getBoundingClientRect();
      const pageCenter = rect.top + rect.height / 2;
      const distance = Math.abs(centerY - pageCenter);
      const idx = Number(node.getAttribute("data-page-index"));

      if (distance < closestDistance) {
        closestDistance = distance;
        closestIndex = idx;
      }
    });

    if (closestIndex !== activePageIndex) {
      setActivePageIndex(closestIndex);
    }
  };

  // ----------------------------
  // Virtual render (keep DOM light)
  // ----------------------------
  const visibleStart = Math.max(0, activePageIndex - 1);
  const visibleEnd = Math.min(pages.length - 1, activePageIndex + 1);

  const visiblePages = useMemo(() => {
    return pages.slice(visibleStart, visibleEnd + 1);
  }, [pages, visibleStart, visibleEnd]);

  // ----------------------------
  // UI
  // ----------------------------
  return (
    <div className="flex flex-col h-screen bg-[#e9ecef] font-sans text-sm overflow-hidden text-[#252525]">
      <PageSetupModal
        isOpen={isPageSetupOpen}
        onClose={() => setIsPageSetupOpen(false)}
        currentSettings={pageSettings}
        onSave={(settings) => setPageSettings(settings)}
      />

      {/* Title Bar */}
      <div className="bg-[#2b579a] text-white flex justify-between items-center px-4 py-1.5 shrink-0 z-50 shadow-md">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="bg-white p-1 rounded-sm">
              <FileText size={16} className="text-[#2b579a]" />
            </div>
            <span className="font-semibold tracking-wide">Behtreen Editor</span>
          </div>

          {/* Menus */}
          <div className="flex space-x-1 ml-4 text-[13px] text-white/90">
            <MenuDropdown
              label="File"
              items={[
                {
                  label: "New",
                  action: () => {
                    if (confirm("Clear all pages?")) {
                      setPages(["<p><br/></p>"]);
                      setActivePageIndex(0);
                      if (editorRef.current) editorRef.current.innerHTML = "<p><br/></p>";
                      updateCounts();
                    }
                  },
                },
                { label: "Save (HTML)", action: () => handleDownload("html"), shortcut: "Ctrl+S" },
                { label: "Export (TXT)", action: () => handleDownload("txt") },
                { label: "Print", action: handlePrint, shortcut: "Ctrl+P" },
              ]}
            />

            <MenuDropdown
              label="Edit"
              items={[
                { label: "Undo", action: () => execCmd("undo"), shortcut: "Ctrl+Z" },
                { label: "Redo", action: () => execCmd("redo"), shortcut: "Ctrl+Y" },
                { label: "Cut", action: () => execCmd("cut"), shortcut: "Ctrl+X" },
                { label: "Copy", action: () => execCmd("copy"), shortcut: "Ctrl+C" },
                {
                  label: "Paste",
                  action: () => navigator.clipboard.readText().then((t) => execCmd("insertText", t)),
                  shortcut: "Ctrl+V",
                },
              ]}
            />

            <MenuDropdown
              label="Insert"
              items={[
                { label: "Page Break", action: insertPageBreak, shortcut: "Ctrl+Enter" },
                {
                  label: "Image",
                  action: () => {
                    const u = prompt("Image URL");
                    if (u) execCmd("insertImage", u);
                  },
                },
                {
                  label: "Link",
                  action: () => {
                    const u = prompt("Link URL");
                    if (u) execCmd("createLink", u);
                  },
                },
              ]}
            />

            <MenuDropdown
              label="View"
              items={[
                { label: "Zoom In", action: () => setZoom((z) => Math.min(z + 10, 200)) },
                { label: "Zoom Out", action: () => setZoom((z) => Math.max(z - 10, 50)) },
                { label: "Fit Width", action: () => setZoom(120) },
              ]}
            />
          </div>
        </div>

        {/* Search + RTL */}
        <div className="flex items-center gap-3">
          <div className="bg-white/20 rounded px-2 py-1 flex items-center min-w-[200px]">
            <Search size={14} className="text-white/70 mr-2" />
            <input
              type="text"
              placeholder="Search"
              className="bg-transparent border-none outline-none text-white text-xs w-full placeholder-white/60"
            />
          </div>

          <button
            onClick={() => setIsRTL(!isRTL)}
            className={`text-xs px-2 py-0.5 rounded border ${
              isRTL ? "bg-white text-blue-800" : "border-white/50"
            }`}
          >
            {isRTL ? "URDU (RTL)" : "ENG (LTR)"}
          </button>

          <button
            onClick={() => setIsPageSetupOpen(true)}
            className="text-xs px-2 py-1 rounded bg-white/15 hover:bg-white/25 flex items-center gap-1"
            title="Page Setup"
          >
            <Settings size={14} />
            Setup
          </button>

          <HelpCircle size={18} className="text-white/80 cursor-pointer" />
        </div>
      </div>

      {/* Ribbon Toolbar */}
      <div className="bg-white border-b border-[#ced4da] py-2 px-4 shadow-sm shrink-0 z-40 flex items-center gap-2 overflow-x-auto whitespace-nowrap custom-scrollbar h-[50px]">
        <div className="flex items-center gap-1 border-r border-[#ced4da] pr-2">
          <ToolbarButton icon={Undo} onClick={() => execCmd("undo")} label="Undo" />
          <ToolbarButton icon={Redo} onClick={() => execCmd("redo")} label="Redo" />
        </div>

        <div className="flex items-center gap-2 border-r border-[#ced4da] pr-2">
          <select
            value={fontName}
            onChange={(e) => {
              execCmd("fontName", e.target.value);
              setFontName(e.target.value);
            }}
            className="w-40 h-7 border border-[#ced4da] rounded-sm text-xs px-1 outline-none focus:border-blue-400 cursor-pointer"
          >
            {FONTS.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>

          <select
            value={fontSize}
            onChange={(e) => {
              execCmd("fontSize", e.target.value);
              setFontSize(e.target.value);
            }}
            className="w-14 h-7 border border-[#ced4da] rounded-sm text-xs px-1 outline-none focus:border-blue-400 cursor-pointer"
          >
            {FONT_SIZES.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-0.5 border-r border-[#ced4da] pr-2">
          <ToolbarButton icon={Bold} onClick={() => execCmd("bold")} isActive={activeFormats.includes("bold")} label="Bold" />
          <ToolbarButton icon={Italic} onClick={() => execCmd("italic")} isActive={activeFormats.includes("italic")} label="Italic" />
          <ToolbarButton icon={Underline} onClick={() => execCmd("underline")} isActive={activeFormats.includes("underline")} label="Underline" />
          <ToolbarButton icon={Strikethrough} onClick={() => execCmd("strikethrough")} isActive={activeFormats.includes("strikethrough")} label="Strike" />
          <ToolbarButton icon={Eraser} onClick={() => execCmd("removeFormat")} label="Clear" />
        </div>

        <div className="flex items-center gap-0.5 border-r border-[#ced4da] pr-2">
          <ToolbarButton icon={Heading1} onClick={() => handleHeading("H1")} label="H1" />
          <ToolbarButton icon={Heading2} onClick={() => handleHeading("H2")} label="H2" />
          <ToolbarButton icon={Heading3} onClick={() => handleHeading("H3")} label="H3" />
        </div>

        <div className="flex items-center gap-0.5 border-r border-[#ced4da] pr-2">
          <ToolbarButton icon={List} onClick={() => execCmd("insertUnorderedList")} isActive={activeFormats.includes("insertUnorderedList")} label="Bullets" />
          <ToolbarButton icon={ListOrdered} onClick={() => execCmd("insertOrderedList")} isActive={activeFormats.includes("insertOrderedList")} label="Numbering" />
          <ToolbarSeparator />
          <ToolbarButton icon={AlignLeft} onClick={() => execCmd("justifyLeft")} isActive={activeFormats.includes("justifyLeft")} label="Left" />
          <ToolbarButton icon={AlignCenter} onClick={() => execCmd("justifyCenter")} isActive={activeFormats.includes("justifyCenter")} label="Center" />
          <ToolbarButton icon={AlignRight} onClick={() => execCmd("justifyRight")} isActive={activeFormats.includes("justifyRight")} label="Right" />
          <ToolbarButton icon={AlignJustify} onClick={() => execCmd("justifyFull")} isActive={activeFormats.includes("justifyFull")} label="Justify" />
        </div>

        <div className="flex items-center gap-1">
          <ToolbarButton
            icon={ImageIcon}
            onClick={() => {
              const u = prompt("Image URL");
              if (u) execCmd("insertImage", u);
            }}
            label="Picture"
          />
          <ToolbarButton
            icon={LinkIcon}
            onClick={() => {
              const u = prompt("Link URL");
              if (u) execCmd("createLink", u);
            }}
            label="Link"
          />
          <ToolbarButton icon={Scissors} onClick={insertPageBreak} label="Page Break" />
        </div>
      </div>

      {/* Main Workspace */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Sidebar */}
        {isSidebarOpen && (
          <div className="w-[240px] bg-white border-r border-[#ced4da] flex flex-col shrink-0">
            <div className="p-3 bg-[#f8f9fa] border-b border-[#ced4da] flex justify-between items-center">
              <span className="font-semibold text-gray-600 text-xs uppercase tracking-wider">
                Navigation
              </span>
              <button onClick={() => setIsSidebarOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={14} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
              {navHeadings.length === 0 ? (
                <div className="text-gray-400 text-xs text-center mt-10 italic px-4">
                  Add Headings (H1, H2, H3) to see them here.
                </div>
              ) : (
                navHeadings.map((h, i) => (
                  <div
                    key={i}
                    onClick={() => scrollToHeading(h.id)}
                    className={`p-2 text-sm cursor-pointer truncate rounded-sm transition-colors ${
                      h.level === 0 ? "font-semibold text-gray-800" : "text-gray-600"
                    } hover:bg-[#e8eff7] hover:text-[#2b579a]`}
                    style={{ paddingLeft: `${h.level * 12 + 8}px` }}
                  >
                    {h.text || "(Empty Heading)"}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Scrollable Pages */}
        <div
          ref={workspaceRef}
          className="flex-1 overflow-y-auto bg-[#e9ecef] relative flex justify-center custom-scrollbar"
          onClick={() => editorRef.current?.focus()}
          onScroll={handleWorkspaceScrollSimple}
        >
          <div className="my-8 flex flex-col items-center gap-10">
            {visiblePages.map((_, localIndex) => {
              const pageIndex = visibleStart + localIndex;

              return (
                <div key={pageIndex} className="flex flex-col items-center">
                  {/* Ruler */}
                  <div style={{ width: A4_WIDTH_PX }}>
                    <Ruler zoom={zoom} />
                  </div>

                  {/* Page */}
                  <div
                    data-page-index={pageIndex}
                    className="word-page-container bg-white mx-auto relative transition-all duration-200"
                    style={{
                      width: A4_WIDTH_PX,
                      height: A4_HEIGHT_PX,
                      backgroundColor: pageSettings.bgColor,
                      paddingTop: paddingTopPx,
                      paddingBottom: paddingBottomPx,
                      paddingLeft: paddingLeftPx,
                      paddingRight: paddingRightPx,
                      boxShadow:
                        pageIndex === activePageIndex
                          ? "0 10px 25px rgba(0,0,0,0.22)"
                          : "0 8px 18px rgba(0,0,0,0.12)",
                      outline:
                        pageIndex === activePageIndex
                          ? "3px solid rgba(43,87,154,0.30)"
                          : "none",
                      transform: `scale(${zoom / 100})`,
                      transformOrigin: "top center",
                    }}
                    onClick={() => setActivePageIndex(pageIndex)}
                  >
                    {pageIndex === activePageIndex ? (
                      <div
                        ref={editorRef}
                        contentEditable
                        suppressContentEditableWarning
                        dir={isRTL ? "rtl" : "ltr"}
                        className={`editor-content outline-none w-full h-full ${
                          isRTL ? "font-nastaleeq text-right" : "text-left"
                        }`}
                        style={{
                          fontFamily: isRTL
                            ? '"Jameel Noori Nastaleeq", "Noto Nastaliq Urdu", serif'
                            : fontName,
                          fontSize: fontSize === "3" ? "12pt" : undefined,
                          lineHeight: isRTL ? "2.0" : "1.6",
                        }}
                        onPaste={handlePasteFast}
                        onInput={handleInput}
                        onKeyUp={checkActiveFormats}
                        onMouseUp={checkActiveFormats}
                        spellCheck={true}
                      />
                    ) : (
                      <div
                        className="editor-content w-full h-full opacity-90 pointer-events-none"
                        dangerouslySetInnerHTML={{ __html: pages[pageIndex] }}
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Sidebar Toggle */}
        {!isSidebarOpen && (
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="absolute top-4 left-4 z-50 bg-white p-2 rounded shadow-md border border-gray-200 text-gray-600 hover:text-blue-600 hover:bg-gray-50 transition-all"
            title="Open Navigation"
          >
            <SidebarIcon size={18} />
          </button>
        )}

        {/* Floating Zoom */}
        <div className="absolute bottom-6 right-8 flex items-center bg-white rounded shadow-lg border border-gray-200 z-50">
          <button
            onClick={() => setZoom((z) => Math.max(z - 10, 50))}
            className="p-2 hover:bg-gray-100 text-gray-600"
          >
            <ZoomOut size={16} />
          </button>
          <span className="w-12 text-center text-xs font-medium border-l border-r border-gray-200 py-2">
            {zoom}%
          </span>
          <button
            onClick={() => setZoom((z) => Math.min(z + 10, 200))}
            className="p-2 hover:bg-gray-100 text-gray-600"
          >
            <ZoomIn size={16} />
          </button>
        </div>
      </div>

      {/* Status Bar */}
      <div className="bg-[#f8f9fa] border-t border-[#ced4da] h-6 px-4 flex justify-between items-center text-[11px] text-[#595959] shrink-0 select-none">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="flex items-center gap-1 hover:bg-[#e2e6ea] px-1 rounded"
          >
            <SidebarIcon size={12} /> Page {activePageIndex + 1} of {pages.length}
          </button>
          <span className="hover:bg-[#e2e6ea] px-1 rounded">{wordCount} words</span>
          <span className="hover:bg-[#e2e6ea] px-1 rounded">{charCount} characters</span>
          <span className="hover:bg-[#e2e6ea] px-1 rounded">
            {isRTL ? "Urdu (Pakistan)" : "English (United States)"}
          </span>
        </div>
      </div>
    </div>
  );
}
