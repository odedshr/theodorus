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

    <xsl:template match="tags">
        <div class="tags reposition-append-sidebar">
            <a name="tags" class="tags-title"><xsl:value-of select="$lbl_tags"/></a>
            <ul class="tag-list">
                <xsl:for-each select="tag">
                    <li class="tag tag-color-{color}">
                        <a href="/tags/{tag}" class="tag-label"><xsl:value-of select="tag" /></a>
                        <span class="tag-count"><xsl:value-of select="count" /></span>
                    </li>
                </xsl:for-each>
            </ul>
        </div>
    </xsl:template>



    <xsl:template match="topicTags">
        <div class="tags reposition-before-comments">
            <a name="tags" class="tags-title"><xsl:value-of select="$lbl_tags"/></a>

            <ul class="tag-list">
                <xsl:for-each select="tag[position() &lt;= 10]">
                    <li class="tag tag-color-{color}">
                        <span class="tag-label"><xsl:value-of select="tag" /></span>
                        <span class="tag-count"><xsl:value-of select="count" /></span>
                    </li>
                </xsl:for-each>
            </ul>

            <xsl:if test="//user/user_id">
                <form id="tags" class="tags-edit" action="/topics/{//topic/topic_id}/tags" method="post">
                    <label class="instructions"><xsl:value-of select="$lbl_tags_instructions"/></label>
                    <input id="tags" name="tags" class="tags-field" type="text" value="{//userTopicTags}" placeholder="{$lbl_tags_placeholder}" title="{$lbl_tags_instructions}" pattern="([^#\/:\s](\s?,\s)?)+"/>
                    <button id="button_update_tags" accesskey="t"><xsl:value-of select="$btn_update_tags" /></button>
                </form>
            </xsl:if>
        </div>
    </xsl:template>


    <xsl:template match="tagTopics">
        <div id="topics-tag" class="reposition-append-main">
            <div class="tag-topics-header">
                <a href="/" class="button-back"><xsl:value-of select="$back_to_main_list" /></a>
                <h2 class="tag-topics-title">
                    <xsl:call-template name="string-replace-all">
                        <xsl:with-param name="text"
                                        select="$showing_items_related_to_x" />
                        <xsl:with-param name="replace" select="$variable" />
                        <xsl:with-param name="by" select="tag" />
                    </xsl:call-template>
                </h2>
            </div>
            <xsl:apply-templates select="page"/>
        </div>
    </xsl:template>
</xsl:stylesheet>