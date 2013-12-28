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

    <xsl:template match="user">
        <xsl:choose>
            <xsl:when test="user_id">
                <div id="menu">
                    <xsl:choose>
                        <xsl:when test="picture">
                            <img src="{picture}" alt="Your image"/>
                        </xsl:when>
                        <xsl:otherwise>
                            <span>Menu</span>
                        </xsl:otherwise>
                    </xsl:choose>
                    <nav id="menu_content">
                        <a id="btn_signout" class="button-signout" href="/signout" title="Sign out"><xsl:value-of select="$btn_signout" /></a>
                    </nav>
                </div>
                <div id="user_name"><xsl:value-of select="display_name" /></div>
            </xsl:when>
            <xsl:otherwise>
                <div class="buttonWrapper"><a id="btn_signup" class="button" href="/signup"><xsl:value-of select="$btn_signup" /></a></div>
                <div class="buttonWrapper"><a id="btn_signin" class="button" href="/signin"><xsl:value-of select="$btn_signin" /></a></div>

                <!--a id="signin-google" class="button-signin" href="/?signin/google" target="_blank">Google</a>
                <a id="signin-facebook" class="button-signin" href="/?signin/facebook" target="_blank">Facebook</a-->
            </xsl:otherwise>
        </xsl:choose>
    </xsl:template>

    <xsl:template match="notification_counter">
        notification_counter
    </xsl:template>

    <xsl:template match="notification_list">
        notification_list
    </xsl:template>

    <xsl:template match="notification">
        notification
    </xsl:template>


    <xsl:template match="signin">
        <form id="form_signin" action="/signin" method="post" class="form_authentication">
            <h2><xsl:value-of select="$welcome_back" /></h2>
            <div>
                <label><xsl:value-of select="$lbl_email" /></label>
                <input type="email" id="email" name="email" required="required" value="{email}"/>
            </div>
            <div>
                <label><xsl:value-of select="$lbl_password" /></label>
                <input type="password" id="password" name="password" required="required"/>
                <input type="hidden" id="md5" name="md5" value="false"/>
            </div>
            <div>
                <input type="checkbox" id="remember" name="remember" value="true"/>
                <label><xsl:value-of select="$lbl_remember_me" /></label>
            </div>
            <div class="form-buttons">
                <button id="button-signin" type="submit"><xsl:value-of select="$btn_signin" /></button>
                <button id="button-cancel" type="reset"><xsl:value-of select="$btn_cancel" /></button>
            </div>
        </form>
    </xsl:template>

    <xsl:template match="signup">
        <form id="form_signup" action="/signup" method="post" class="form_authentication">
            <h2><xsl:value-of select="$welcome" /></h2>
            <div>
                <label><xsl:value-of select="$lbl_name" /></label>
                <input type="text" id="name" name="name" required="required" pattern="{{4,}}" placeholder="{$lbl_name_example}" value="{name}"/>
            </div>
            <div>
                <label><xsl:value-of select="$lbl_email" /></label>
                <input type="email" id="email" name="email" required="required" placeholder="{$lbl_email_example}" value="{email}"/>
            </div>
            <div>
                <label><xsl:value-of select="$lbl_password" /></label>
                <input type="password" id="password" name="password" required="required" pattern="{{3,}}"/>
                <input type="hidden" id="md5" name="md5" value="false"/>
            </div>
            <div>
                <label><xsl:value-of select="$lbl_repeat_password" /></label>
                <input type="password" id="password_repeat" name="password_repeat" required="required"/>
            </div>
            <div>
                <input type="checkbox" id="terms_of_use" name="terms_of_use" required="required"/>
                <label><xsl:value-of select="$lbl_terms_of_use" /></label>
                <div id="terms-of-use"><xsl:copy-of select="$terms_of_use" /></div>
            </div>
            <div class="form-buttons">
                <button id="button-signup" type="submit"><xsl:value-of select="$btn_signup" /></button>
                <button id="button-cancel" type="reset"><xsl:value-of select="$btn_cancel" /></button>
            </div>
        </form>
    </xsl:template>

    <xsl:template match="signout">
        <div>
            <xsl:value-of select="$signout_title" />
        </div>
    </xsl:template>

</xsl:stylesheet>