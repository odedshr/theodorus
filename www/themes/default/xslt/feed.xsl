<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE xsl:stylesheet  [
        <!ENTITY nbsp   "&#160;">
        <!ENTITY copy   "&#169;">
        <!ENTITY reg    "&#174;">
        <!ENTITY trade  "&#8482;">
        <!ENTITY mdash  "&#8212;">
        <!ENTITY ldquo  "&#8220;">
        <!ENTITY rdquo  "&#8221;">
        <!ENTITY pound  "&#163;">
        <!ENTITY yen    "&#165;">
        <!ENTITY euro   "&#8364;">
        ]>
    <xsl:stylesheet id="sheet" version="1.0"
                    xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
        <xsl:output method="html" encoding="UTF-8"/>

        <xsl:template match="mainfeed">
            <noscript>
                <h1><xsl:value-of select="$javascript_disabled_title" /></h1>
                <div><xsl:value-of select="$javascript_disabled_instructions" /></div>
            </noscript>
            <header>
                <h1><span><xsl:value-of select="$app_name" /></span></h1>
            </header>
            <div id="loading_system"><xsl:value-of select="$system_loading" /></div>
        </xsl:template>

        <xsl:template match="page[@type='feed']">
            <header>
                <h1><span><xsl:value-of select="$app_name" /></span></h1>
                <div id="account">
                    <xsl:apply-templates select="user" />
                </div>
                <form id="form_search" action="/search" get="post">
                    <input type="text" />
                    <button class="tag"><span>כלכלה-ואוצר</span></button>
                    <button class="tag"><span>איכות-הסביבה</span></button>
                    <button class="tag"><span>משאבי-טבע</span></button>
                    <button class="tag"><span>חינוך-והשכלה</span></button>
                    <button class="tag"><span>רווחה</span></button>
                    <button class="tag"><span>תשתיות</span></button>
                    <button class="tag"><span>תרבות-וספורט</span></button>
                    <button class="tag"><span>זכויות-אדם</span></button>
                    <button class="tag"><span>מורשת</span></button>
                    <button class="tag"><span>פלילים</span></button>
                    <button class="tag"><span>חוק-ומשפט</span></button>
                    <button class="tag"><span>ממשל</span></button>
                    <button class="tag"><span>בטחון-פנים</span></button>
                    <button class="tag"><span>בריאות</span></button>
                    <button class="tag"><span>רווחה</span></button>
                    <button class="tag"><span>מדיניות-חוץ</span></button>
                    <button class="tag"><span>ביטחון</span></button>
                    <button class="tag"><span>מדע-וטכנולוגיה</span></button>
                    <button class="tag"><span>עלייה</span></button>
                    <button class="tag"><span>תחבורה</span></button>
                    <button class="tag"><span>תעשייה-ומסחר</span></button>
                    <button class="tag"><span>תקשורת</span></button>
                    <button class="tag"><span>תיירות</span></button>
                </form>
                <xsl:if test="addTopic">
                    <a id="link_suggest_topic" href="/topics/add" class="button"><xsl:value-of select="$link_suggest_topic" /></a>
                </xsl:if>
            </header>
            <div id="feed">
                <div id="topics" />
            </div>
        </xsl:template>

        <xsl:template match="addTopic">
            <form id="form_add_topic" action="/topics" method="POST">
                <div>
                    <label><xsl:value-of select="$lbl_topic_title" /></label>
                    <textarea name="title" id="topic_title" maxlength="140" required="required" pattern="{{5,}}" placeholder="{$example_topic_title}" />
                    <div><span id="topic_title_chars_left"/><span><xsl:value-of select="$characters_left" /></span></div>
                </div>
                <div>
                    <label><xsl:value-of select="$lbl_topic_slug" /></label>
                    <span id="topic_complete_slug">
                        <span id="slug_prefix"><xsl:value-of select="@prefix" /></span>
                        <input type="text" name="slug" id="slug" placeholder="{$example_topic_title_slug}" pattern="[a-zA-Z0-9\.\-_\$]{{0,140}}"></input>
                        <div id="slug_result" />
                    </span>
                </div>
                <div>
                    <label><xsl:value-of select="$lbl_topic_tags" /></label>
                    <input type="text" name="tags" id="topic_tags" placeholder="{$example_topic_tags}"></input>
                </div>
                <div>
                    <button id="button_suggest"><xsl:value-of select="$btn_suggest" /></button>
                    <button id="button_cancel" type="reset"><xsl:value-of select="$btn_cancel" /></button>
                </div>
            </form>
        </xsl:template>

        <xsl:template match="slugTest">
            <xsl:variable name="vSelector" select="@result"/>
            <xsl:variable name="resultMessage" select="ext:node-set($slugResults)/*[@type=$vSelector]"/>
            <xsl:if test="count(ext:node-set($slugResults)/*[@type=$vSelector]) &gt; 0">
                <xsl:value-of select="$resultMessage"/>
            </xsl:if>
        </xsl:template>

        <xsl:template match="topics">
            <ul>
                <xsl:apply-templates match="topic" />
            </ul>
        </xsl:template>

        <xsl:template match="topic">
            <xsl:variable name="vSelector" select="created"/>
            <xsl:variable name="prettyCreated" select="ext:node-set($timestamps)/*[@id=$vSelector]"/>
            <!--<xsl:variable name="prettyCreated">
                <xsl:call-template name="string-replace-all">
                    <xsl:with-param name="text" select="ext:node-set($timestamps)/*[@type=$vSelector]" />
                    <xsl:with-param name="replace" select="'#'" />
                    <xsl:with-param name="by" select="created/@value" />
                </xsl:call-template>
            </xsl:variable>-->

            <li class="topic">
                <div class="title"><xsl:value-of select="title" /></div>
                <a class="inititiator"><xsl:value-of select="user/display_name" /></a>
                <time class="created" datetime="{created/@timestamp}"><xsl:value-of select="$prettyCreated" /></time>
            </li>
        </xsl:template>
    </xsl:stylesheet>