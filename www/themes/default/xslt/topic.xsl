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
                    <div><xsl:value-of select="topic/content" /></div>
                    <!--<xsl:choose>
                        <xsl:when test="topic[status='idea']">idea</xsl:when>
                        <xsl:when test="topic[status='discussion']">discussion</xsl:when>
                        <xsl:when test="topic[status='proposition']">proposition</xsl:when>
                        <xsl:when test="topic[status='decision']">decision</xsl:when>
                    </xsl:choose>-->
                    <ul id="socialTools">
                        <li>
                             <a href="https://twitter.com/share" class="twitter-share-button" data-size="large" data-dnt="true"><xsl:value-of select="$tweet" /></a>
                            <script>!function(d,s,id){var js,fjs=d.getElementsByTagName(s)[0],p=/^http:/.test(d.location)?'http':'https';if(!d.getElementById(id)){js=d.createElement(s);js.id=id;js.src=p+'://platform.twitter.com/widgets.js';fjs.parentNode.insertBefore(js,fjs);}}(document, 'script', 'twitter-wjs');</script>
                        </li>
                        <li>
                            <iframe src="//www.facebook.com/plugins/like.php?href={url}&amp;width=450&amp;height=21&amp;colorscheme=light&amp;layout=button_count&amp;action=like&amp;show_faces=true&amp;send=false&amp;appId=1394431237451482" scrolling="no" frameborder="0" style="border:none; overflow:hidden; width:450px; height:21px;" allowTransparency="true"></iframe>
                        </li>
                        <li>
                            <div class="g-plusone"></div>
                            <script type="text/javascript">
                                (function() {
                                    var po = document.createElement('script'); po.type = 'text/javascript'; po.async = true;
                                    po.src = 'https://apis.google.com/js/plusone.js';
                                    var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(po, s);
                                })();
                            </script>
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