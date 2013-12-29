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

    <xsl:template match="page[@type='addTopic']">
        <form id="form_add_topic" action="/topics" method="POST">
            <div>
                <label><xsl:value-of select="$lbl_topic_title" /></label>
                <textarea name="title" id="topic_title" maxlength="140" required="required" pattern=".{{5,}}" placeholder="{$example_topic_title}" />
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

    <xsl:template match="page[@type='topicView']">
        <noscript>
            <h1><xsl:value-of select="$javascript_disabled_title" /></h1>
            <div><xsl:value-of select="$javascript_disabled_instructions" /></div>
        </noscript>
        <header>
            <h1><span><xsl:value-of select="$app_name" /></span></h1>
        </header>
        <div id="topic">
            <xsl:choose>
                <xsl:when test="topicLoading">
                    <div id="loading_system"><xsl:value-of select="$system_loading" /></div>
                </xsl:when>
                <xsl:when test="topic">
                    <h2><xsl:value-of select="topic/title" /></h2>
                    <div id="content"><xsl:value-of select="topic/content" /></div>
                    <div id="comments" />
                    <!--<xsl:choose>
                        <xsl:when test="topic[status='idea']">idea</xsl:when>
                        <xsl:when test="topic[status='discussion']">discussion</xsl:when>
                        <xsl:when test="topic[status='proposition']">proposition</xsl:when>
                        <xsl:when test="topic[status='decision']">decision</xsl:when>
                    </xsl:choose>-->
                    <ul id="socialTools">
                        <li class="twitter">
                            <a href="https://twitter.com/share" class="twitter-share-button" data-text="{topic/title}"><xsl:value-of select="$tweet"/></a>
                            <script>!function(d,s,id){
                                    var js,
                                        fjs=d.getElementsByTagName(s)[0],
                                        p=/^http:/.test(d.location)?'http':'https';
                                        if(!d.getElementById(id)){
                                            js=d.createElement(s);
                                            js.id=id;
                                            js.src=p+'://platform.twitter.com/widgets.js';
                                            fjs.parentNode.insertBefore(js,fjs);
                                        }
                                        }(document, 'script', 'twitter-wjs');</script>
                        </li>
                        <li class="google">
                            <div class="g-plusone" />
                            <script type="text/javascript">
                                (function() {
                                    var po = document.createElement('script'); po.type = 'text/javascript'; po.async = true;
                                    po.src = 'https://apis.google.com/js/plusone.js';
                                    var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(po, s);
                                })();
                            </script>
                        </li>
                        <li class="facebook">
                            <iframe src="//www.facebook.com/plugins/like.php?href={url}&amp;width=450&amp;height=21&amp;colorscheme=light&amp;layout=button_count&amp;action=like&amp;show_faces=true&amp;send=false&amp;appId=1394431237451482"
                                    scrolling="no"
                                    allowTransparency="true" />
                        </li>
                    </ul>
                </xsl:when>
                <xsl:when test="message">
                    <div><xsl:value-of select="$file_not_found_title" /></div>
                    <div><xsl:value-of select="$file_not_found-what_to_do" /></div>
                </xsl:when>
                <xsl:otherwise>
                    <div><xsl:value-of select="$failed_to_load_topic" /></div>
                </xsl:otherwise>
            </xsl:choose>
        </div>
    </xsl:template>
</xsl:stylesheet>