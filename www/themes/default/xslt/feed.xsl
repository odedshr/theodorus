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
                    xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
                    xmlns:exslt="http://exslt.org/common">
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
            </header>
            <div id="feed_wrapper">
                <div id="feed">
                    <div id="topics" />
                    <div id="sidebar">
                        <xsl:if test="addTopic">
                            <div id="suggest_topic">
                                <a id="link_suggest_topic" href="/topics/add" class="button" accesskey="a"><xsl:value-of select="$link_suggest_topic" /></a>
                            </div>
                        </xsl:if>
                        <div id="tags" />
                    </div>
                </div>
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
                        <input type="text" name="slug" id="slug" placeholder="{$example_topic_title_slug}" pattern="[a-zA-Z0-9\.\-_\$]{{0,140}}" />
                        <div id="slug_result" />
                    </span>
                </div>
                <div>
                    <label><xsl:value-of select="$lbl_topic_tags" /></label>
                    <input type="text" name="tags" id="topic_tags" placeholder="{$example_topic_tags}" />
                </div>
                <div>
                    <button id="button_suggest" accesskey="s"><xsl:value-of select="$btn_suggest" /></button>
                    <button id="button_cancel" type="reset" accesskey="x"><xsl:value-of select="$btn_cancel" /></button>
                </div>
            </form>
        </xsl:template>

        <xsl:template match="slugTest">
            <xsl:variable name="vSelector" select="@result"/>
            <xsl:variable name="resultMessage" select="exslt:node-set($slugResults)/*[@type=$vSelector]"/>
            <xsl:if test="count(exslt:node-set($slugResults)/*[@type=$vSelector]) &gt; 0">
                <xsl:value-of select="$resultMessage"/>
            </xsl:if>
        </xsl:template>

        <xsl:template match="tags">
            <h2><xsl:value-of select="$lbl_tags" /></h2>
            <ul>
                <xsl:for-each select="tag">
                    <xsl:sort select="@count" data-type="number" order="descending"/>
                    <li class="tag">
                        <span class="tag-color" style="background-color:{@color}">&nbsp;</span>
                        <a href="/#{current()}"><xsl:apply-templates select="current()" /></a>
                        <xsl:if test="@count &gt; 0">
                            <span class="tag-count"><xsl:apply-templates select="@count" /></span>
                        </xsl:if>
                    </li>
                </xsl:for-each>
            </ul>
        </xsl:template>

        <xsl:template match="topics">
            <ul>
                <xsl:apply-templates select="topic" />
            </ul>
        </xsl:template>

        <xsl:template match="topic">
            <xsl:variable name="vSelector" select="created"/>
            <!--<xsl:variable name="prettyCreated" select="exslt:node-set($timestamps)/*[@id=$vSelector]"/> -->
            <xsl:variable name="prettyCreated">
                <xsl:call-template name="string-replace-all">
                    <xsl:with-param name="text" select="exslt:node-set($timestamps)/*[@id=$vSelector]" />
                    <xsl:with-param name="replace" select="'#'" />
                    <xsl:with-param name="by" select="created/@value" />
                </xsl:call-template>
            </xsl:variable>

            <li class="topic">
                <a href="{url}" class="title"><xsl:value-of select="title" /></a>
                <a class="inititiator"><xsl:value-of select="user/display_name" /></a>
                <time class="created" datetime="{created/@timestamp}" title="{created/@formatted}"><xsl:value-of select="$prettyCreated" /></time>
                <div class="tags">
                    <xsl:for-each select="tags/tag">
                        <div class="tag">
                            <span class="tag-color" style="background-color:{@color}">&nbsp;</span>
                            <a href="/#{current()}"><xsl:apply-templates select="current()" /></a>
                            <xsl:if test="@count &gt; 0">
                                <span class="tag-count"><xsl:apply-templates select="@count" /></span>
                            </xsl:if>
                        </div>
                    </xsl:for-each>
                </div>
                <div class="actions">
                    <a class="button-action" href="{url}/endorse">
                        <xsl:if test="endorse/@me = 'true'">
                            <xsl:attribute name="href">/<xsl:value-of select="url"/>/unendorse</xsl:attribute>
                            <xsl:attribute name="class">button-action pressed</xsl:attribute>
                        </xsl:if>
                        <xsl:value-of select="$btn_endorse" />
                        <span class="count"><xsl:value-of select="endorse" /></span>

                    </a>
                    <a class="button-action" href="{url}/follow">
                        <xsl:if test="follow/@me = 'true'">
                            <xsl:attribute name="href">/<xsl:value-of select="url"/>/unfollow</xsl:attribute>
                            <xsl:attribute name="class">button-action pressed</xsl:attribute>
                        </xsl:if>
                        <xsl:value-of select="$btn_follow" />
                        <span class="count"><xsl:value-of select="follow" /></span>
                    </a>
                    <a class="button-action" href="{url}/report">
                    <xsl:if test="report/@me = 'true'">
                        <xsl:attribute name="href">/<xsl:value-of select="url"/>/unreport</xsl:attribute>
                        <xsl:attribute name="class">button-action pressed</xsl:attribute>
                    </xsl:if>
                    <xsl:value-of select="$btn_report" />
                    <span class="count"><xsl:value-of select="report" /></span>
                </a>
                </div>
            </li>
        </xsl:template>
    </xsl:stylesheet>