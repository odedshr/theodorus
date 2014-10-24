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
                xmlns:exslt="http://exslt.org/common"><!-- keep xslt here. it's used by feed.xsl-->
    <xsl:include href="common.xsl" />
    <xsl:output method="html" encoding="UTF-8"/>

    <xsl:param name="language" select="'hebrew'"/>
    <xsl:param name="variable" select="'#'"/>
    <xsl:param name="window_title" select="'Theodorus'"/>
    <xsl:param name="app_name" select="'תיאודורוס'"/>
    <xsl:param name="javascript_disabled_title" select="'הפעלת קוד גאוהסקריפט אינה זמינה בדפדפן האינטרנט שלך'"/>
    <xsl:param name="javascript_disabled_instructions" select="'כרגע אין תמיכה לדפדנים ללא תמיכה בגאוהסקריפט'"/>
    <xsl:param name="text_intro" select="'מערכת דמוקרטית לניהול רעיונות ודיונים. כל אחד יכול להציע רעיון. כולם משתתפים בדיון, מוצאים פשרות ומגיעים להסכמות. כי ככה צריך לנהל קהילה.'"/>
    <xsl:param name="community_has_X_members" select="'בקהילה שלנו # חברים וחברות.'"/>
    <xsl:param name="system_loading" select="'טוען קבצים, אנא המתן...'"/>
    <xsl:param name="previous_page" select="'לעמוד הקודם'"/>

    <xsl:param name="page" select="'עמוד'"/>
    <xsl:param name="out_of" select="'מתוך'"/>
    <xsl:param name="previous" select="'הקודם'"/>
    <xsl:param name="next" select="'הבא'"/>

    <xsl:param name="error_has_occoured" select="'אירעה שגיאה'"/>
    <xsl:param name="error_unknown" select="'שגיאה לא ידועה'"/>
    <xsl:variable name="errorMessages">
        <error type="page-not-found">העמוד המבוקש לא נמצא</error>
        <error type="passwords-dont-match">הסיסמאות אינן תואמות</error>
        <error type="password-too-short">הסיסמא קצרה מדי</error>
        <error type="password-too-simple">הסיסמא פשוטה מדי</error>
        <error type="terms-of-use-not-approved">תנאי השימוש לא אושרו</error>
        <error type="uid-is-invalid">מספר הזהות איננו חוקי</error>
        <error type="email-is-invalid">כתובת הדואל איננה חוקית</error>
        <error type="email-in-use">כתובת הדואל שבחרת כבר רשומה במערכת</error>
        <error type="name-too-short">שם המשתמש קצר מדי</error>
        <error type="name-in-use">שם המשתמש כבר בשימוש</error>
        <error type="method-not-implemented">המתודה טרם יושמה</error>
        <error type="bad-credentials">פרטי ההתחברות שגויים</error>
        <error type="no-permission">אין לך הרשאות לפעולה זו</error>
        <error type="no-input">פעולה זו דורשת קלט</error>
        <result type="title-too-long">הכותרת ארוכה מדי</result>
        <result type="title-too-short">הכותרת קצרה מדי</result>
        <result type="slug-too-short">כתובת קצרה מדי</result>
        <result type="slug-is-invalid">כתובת לא תקנית</result>
        <result type="slug-not-available">כתובת לא זמינה</result>
        <result type="comment-too-long">התגובה ארוכה מדי</result>
        <result type="comment-too-short">התגובה קצרה מדי</result>
        <error type="item-not-found">הפריט לא נמצא</error>
        <error type="system-error">שגיאת מערכת</error>
        <error type="topic-not-found">הודעה לא נמצאה</error>
        <error type="comment-not-found">תגובה לא נמצאה</error>
        <error type="image-process-failed">עיבוד תמונה נכשל</error>
        <error type="user-already-activated">המשתמש כבר פעיל. אין צורך באימות הדואל...</error>
        <error type="email-confirmation-invalid">אימות הדואל נכשל. קוד האימות שגוי.</error>
        <error type="email-is-unknown">דואל זה איננו רשום במערכת</error>
        <error type="old-password-is-wrong">הסיסמא הישנה שגויה</error>
        <error type="unknown_error">שגיאה לא ידועה</error>
    </xsl:variable>

    <xsl:variable name="infoMessages">
        <error type="authenticating">מאמת נתונים</error>
        <error type="sending-data">שולח מידע</error>
        <error type="reset-email-sent">הוראות לעדכון הסיסמא נשלחו לתיבת הדואל שלך</error>
        <error type="password-changed">סיסמא עודכנה בהצלחה</error>
    </xsl:variable>

    <xsl:variable name="timestamps">
        <timeLabel id="just-now">הרגע</timeLabel>
        <timeLabel id="a-minute-ago">לפני דקה</timeLabel>
        <timeLabel id="two-minutes-ago">לפני דקותיים</timeLabel>
        <timeLabel id="#-minutes-ago">לפני # דקות</timeLabel>
        <timeLabel id="quarter-of-an-hour-ago">לפני רבע שעה</timeLabel>
        <timeLabel id="half-an-hour-ago">לפני חצי שעה</timeLabel>
        <timeLabel id="an-hour-ago">לפני שעה</timeLabel>
        <timeLabel id="two-hours-ago">לפני שעתיים</timeLabel>
        <timeLabel id="#-hours-ago">לפני # שעות</timeLabel>
        <timeLabel id="yesterday">אתמול</timeLabel>
        <timeLabel id="two-days-ago">שלשום</timeLabel>
        <timeLabel id="#-days-ago">לפני # ימים</timeLabel>
        <timeLabel id="a-week-ago">לפני שבוע</timeLabel>
        <timeLabel id="two-weeks-ago">לפני שבועיים</timeLabel>
        <timeLabel id="#-weeks-ago">לפני # שבועות</timeLabel>
    </xsl:variable>

    <xsl:param name="title_signin" select="'תיאודורוס: התחברות'"/>
    <xsl:param name="title_signup" select="'תיאודורוס: הרשמה'"/>
    <xsl:param name="explain_confirm_email">
        <span>בסיום תהליך ההרשמה הקצר לתיאדורוס תוכלו לקחת חלק פעיל בקהילה ולהשתתף בתהליך הדמוקרטי.</span><br/>
        <span>ראשית, יש לאמת את כתובת הדואל שלך:</span>
    </xsl:param>
    <xsl:param name="btn_confirm_email" select="'לאימות הדואל, לחצו כאן'"/>
    <xsl:param name="explain_email_confirmation_email">קיבלת את הדואל? מצוין! כעת נותר רק להשלים להשלים את תהליך ההרשמה ולהתחיל לתרום לקהילה שלך.</xsl:param>

    <xsl:param name="lbl_confirm_email_sent" select="'מכתב אישור נשלח לכתובת הדואל שלך!'"/>
    <xsl:param name="explain_confirm_email_check_email" select="'על מנת להמשיך בתהליך ההרשמה יש ללחוץ על הקישור שמופיע במכתב האימות.'"/>
    <xsl:param name="explain_confirm_email_check_spam" select="'המכתב לא הגיע? כדאי לבדוק בתיבת הספאם.'"/>


    <xsl:param name="title_forgotPassword" select="'שכחת את הסיסמא שלך?'"/>
    <xsl:param name="explain_forgot_password">
        <span>לא נורא, זה קורה לכולם. לקבלת קישור לאיפוס הסיסמא לתיבת הדואל שלך, נא להזין את הכתובת -</span>
    </xsl:param>

    <xsl:param name="btn_send_link" select="'שליחת קישור'"/>
    <xsl:param name="explain_reset_password_email">קיבלת את הדואל? מצוין! כעת נותר רק לקבוע סיסמא חדשה.</xsl:param>
    <xsl:param name="explain_reset_password_email_warning">אם לא ביקשת איפוס סיסמא מישהו אחר הזין את הדואל שלך, אולי זאת הזדמנות טובה לבחור סיסמא חדשה בכל זאת</xsl:param>

    <xsl:param name="link_change_password" select="'שינוי סיסמא'"/>
    <xsl:param name="btn_reset_password" select="'לאיפוס הסיסמא, לחצו כאן'"/>
    <xsl:param name="title_change_password" select="'עדכון סיסמא'"/>
    <xsl:param name="btn_update_password" select="'עדכון סיסמא'"/>

    <xsl:param name="lbl_name" select="'שם (או כינוי)'"/>
    <xsl:param name="lbl_name_example" select="'לדוגמא: ישראל ישראלי'"/>
    <xsl:param name="lbl_email" select="'כתובת דואל מלאה'"/>
    <xsl:param name="lbl_email_example" select="'e.g.: israel@gmail.com'"/>
    <xsl:param name="lbl_current_password" select="'סיסמא נוכחית'"/>
    <xsl:param name="lbl_password" select="'סיסמא'"/>
    <xsl:param name="lbl_repeat_password" select="'סיסמה בשנית'"/>
    <xsl:param name="lbl_forgot_password" select="'שכחת סיסמא?'"/>
    <xsl:param name="lbl_terms_of_use" select="'אני מאשר שקראתי ואני מסכים לפעול לפי כללי השימוש במערכת'"/>
    <xsl:param name="lbl_remember_me" select="'זכור אותי'"/>
    <xsl:param name="password_security_instructions">
        <ul>
            <h3>איך לבחור סיסמא מאובטחת?</h3>
            <li>
                <h4>סיסמא לא מאובטחת</h4>
                <ul>
                    <li class="note">3 תוים לפחות</li>
                    <li class="note">כל התוים שייכים לאותה קבוצה (ספרות, אותיות גדולות, אותיות קטנות)</li>
                    <li class="note">דוגמאות: “easy”,”8892″,”NOTSECURE”</li>
                </ul>
            </li>
            <li>
                <h4>סיסמא סבירה</h4>
                <ul>
                    <li class="note">6 תוים לפחות</li>
                    <li class="note">שילוב של ספרות ואותיות</li>
                    <li class="note">לדוגמא: “common1″,”7etmein”</li>
                </ul>
            </li>
            <li>
                <h4>סיסמא מאובטחת</h4>
                <ul>
                    <li class="note">8 תוים לפחות</li>
                    <li class="note">שילוב של אותיות גדולות וקטנות עם ספרות או סימנים מיוחדים</li>
                    <li class="note">לדוגמא: “15NotEasy”,”Bett.er-Yet”</li>
                </ul>
            </li>
            <li>
                <h4>סיסמא סופר-מאובטחת</h4>
                <ul>
                    <li class="note">8 תוים לפחות</li>
                    <li class="note">שילוב של כל קבוצות התוים האפשריות</li>
                    <li class="note">לדוגמא: ”o0Q!i9W@e3”</li>
                </ul>
            </li>
        </ul>
    </xsl:param>
    <xsl:param name="terms_of_use">
        <ol>
            <li class="note">אין לעודד אלימות</li>
            <li class="note">אין לפרסם תוכן שיווקי שאיננו רלוונטי לדיון</li>
            <li class="note">אין לפגוע בזכויות יוצרים</li>
            <li class="note">המשתמש/ת הינו/הינה האחראי/ת הבלעדי/ת לתוכן שהוא/היא פירסם/פירסמה</li>
        </ol>
    </xsl:param>

    <xsl:param name="signout_title" select="'תודה ולהתראות'"/>
    <xsl:param name="btn_signout" select="'התנתקות'"/>
    <xsl:param name="btn_signin" select="'התחברות'"/>
    <xsl:param name="btn_signup" select="'הצטרפות'"/>
    <xsl:param name="btn_submit_signin" select="'אישור'"/>
    <xsl:param name="btn_submit_signup" select="'אישור'"/>
    <xsl:param name="btn_ok" select="'אישור'"/>
    <xsl:param name="btn_cancel" select="'ביטול'"/>
    <xsl:param name="welcome" select="'ברוכים הבאים'"/>
    <xsl:param name="almost_completed" select="'כמעט וסיימנו...'"/>
    <xsl:param name="welcome_back" select="'ברוכים השבים'"/>
    <xsl:param name="nav_blog" select="'בלוג הפרוייקט'"/>
    <xsl:param name="nav_features" select="'פיצ׳רים'"/>
    <xsl:param name="nav_sourcecode" select="'הקוד'"/>
    <xsl:param name="nav_donations" select="'תרומות'"/>
    <xsl:param name="link_to_main_page" select="'לעמוד הראשי'"/>
    <xsl:param name="back_to_main_page" select="'בחזרה לעמוד הראשי'"/>
    <xsl:param name="back_to_main_list" select="'בחזרה לרשימה הראשית'"/>
    <xsl:param name="link_edit" select="'עריכה'"/>
    <xsl:param name="draft_is_empty" select="'ההצעה חסרת תוכן כרגע'"/>
    <xsl:param name="write_topic_content_here" select="'ניתן להוסיף תוכן להצעה כאן'"/>
    <xsl:param name="lbl_push_new_section" select="'הוספת פיסקה נוספת כאן'"/>
    <xsl:param name="lbl_new_alternative" select="'אלטרנטיבה חדשה'"/>
    <xsl:param name="lbl_remove_section" select="'עדיף להוריד את הפיסקה'"/>

    <xsl:param name="lbl_topic_title" select="'כותרת'"/>
    <xsl:param name="example_topic_title">לדוגמא: לכל אזרח תהיה האפשרות להציע חוקים והצעות פופולריות יהפכו לטיוטה משותפת שבסופו של דבר תעמוד לסוג של משאל עם</xsl:param>
    <xsl:param name="characters_left" select="'תוים נותרו'"/>
    <xsl:param name="lbl_topic_slug" select="'כתובת slug (באנגלית)'"/>
    <xsl:param name="example_topic_title_slug" select="'democracy-for-everyone'"/>
    <xsl:variable name="slugResults">
        <result type="slug-too-short">כתובת קצרה מדי</result>
        <result type="slug-is-invalid">כתובת לא תקנית</result>
        <result type="slug-not-available">כתובת לא זמינה</result>
        <result type="slug-is-available">כתובת זמינה</result>
    </xsl:variable>

    <xsl:param name="lbl_topic_feedback" select="'משוב'"/>
    <xsl:param name="link_suggest_topic" select="'נושא חדש'"/>
    <xsl:param name="btn_remove" select="'הסרה'"/>
    <xsl:param name="stat_endorse" select="'תומכים'"/>
    <xsl:param name="btn_endorse" select="'תומכים'"/>
    <xsl:param name="btn_endorse_tooltip" select="'הבעת תמיכה'"/>
    <xsl:param name="btn_unendorse_tooltip" select="'הסרת תמיכה'"/>
    <xsl:param name="stat_follow" select="'עוקבים'"/>
    <xsl:param name="btn_follow" select="'מעקב'"/>
    <xsl:param name="stat_report" select="'דיווחים'"/>
    <xsl:param name="btn_report" select="'זה לא ראוי!'"/>
    <xsl:param name="stat_comment" select="'תגובות'"/>
    <xsl:param name="btn_comment" select="'הוספת תגובה'"/>
    <xsl:param name="stat_opinion" select="'דעות'"/>
    <xsl:param name="btn_opinion" select="'הוספת דעה'"/>

    <xsl:param name="showing_x_items" select="'מציג # פריטים'" />
    <xsl:param name="showing_items_related_to_x" select="'פריטים הקשורים ל#'" />
    <xsl:param name="lbl_no_topics_found" select="'לא נמצאו פריטים!'"/>
    <xsl:param name="lbl_no_topics_found_suggest_one" select="'אולי תציעו אחד כעת?'"/>
    <xsl:param name="file_not_found_title" select="'הפריט שחיפשת לא קיים'"/>
    <xsl:param name="file_not_found-what_to_do">
        <p>עימך הסליחה, אבל הפריט אליו ניסית לגשת לא קיים</p>
        <ul>
            <li class="note">ייתכן ויש שגיאה בכתובת?</li>
            <li class="note">ייתכן והלינק לא מעודכן?</li>
        </ul>
        <p>חזור ל<a href="/">דף הראשי</a></p>
    </xsl:param>

    <xsl:param name="failed_to_load_topic" select="'טעינת פריט נכשלה'"/>
    <xsl:param name="back" select="'חזרה'"/>
    <xsl:param name="opinions" select="'דעות'"/>
    <xsl:param name="your_topic" select="'ההצעה שלך'"/>
    <xsl:param name="your_opinion" select="'הדעה שלך'"/>
    <xsl:param name="his_opinion" select="'הדעה של'"/>
    <xsl:param name="your_comment" select="'התגובה שלך'"/>
    <xsl:param name="his_comment" select="'התגובה של'"/>
    <xsl:param name="other_opinions" select="'דעות נוספות'"/>
    <xsl:param name="no_other_opinions" select="'אין דעות נוספות כרגע'"/>
    <xsl:param name="no_opinions" select="'אין דעות כרגע'"/>
    <xsl:param name="add_comment" select="'הוספה'"/>
    <xsl:param name="update_comment" select="'עדכון'"/>
    <xsl:param name="btn_add_comment" select="'הוספת תגובה'"/>
    <xsl:param name="btn_update_comment" select="'עדכון תגובה'"/>
    <xsl:param name="tweet" select="'ציוץ'"/>
    <xsl:param name="read_complete_discussion" select="'לקריאת הדיון המלא'"/>

    <xsl:param name="lbl_topic_tags" select="'תגיות'"/>
    <xsl:param name="example_topic_tags" select="'ממשל'"/>
    <xsl:param name="btn_suggest" select="'הוספה'"/>
    <xsl:param name="lbl_tags" select="'תגיות'"/>
    <xsl:param name="lbl_tags_placeholder" select="'תגיות מופרדות בפסיק, אין צורך להוסיף סולמית'"/>
    <xsl:param name="lbl_tags_instructions" select="'הוספה ותמיכה בתגיות קיימות על מנת תעזור לאחרים להגיע אל הדיון.'"/>
    <xsl:param name="btn_update_tags" select="'עדכון תגיות'"/>


    <xsl:param name="btn_update_image" select="'עדכון תמונה'"/>
    <xsl:param name="btn_remove_image" select="'הסרת תמונה'"/>
    <xsl:param name="approve_profile_image" select="'נא לאשר את תמונת הפרופיל'"/>

    <xsl:param name="logged_action_server" select="'שרת'"/>
    <xsl:param name="logged_action_type" select="'סוג הודעה'"/>
    <xsl:param name="logged_action_content" select="'תוכן'"/>

    <xsl:variable name="mailSubjects">
        <label key="email-confirm">ברוכים הבאים לתיאודורוס</label>
        <label key="invite-to-app">קיבלת הזמנה לתיאודורוס</label>
        <label key="logged-action">תיאודורוס: פעולה מתועדת</label>
        <label key="reset-password">תיאודורוס: איפוס סיסמא</label>
        <label key="invite-to-topic">קיבלת הזמנה לדיון בנושא #</label>
        <label key="daily-report">תיאודורוס: דיווח יומי</label>
        <label key="got-comment">תיאודורס: מישהו הגיב על משהו שכתבת!</label>
        <label key="got-opinion">תיאודורוס: מישהו הביא דעה על רעיון שהצעת</label>
    </xsl:variable>

    <xsl:template match="/">
        <xsl:apply-templates />
    </xsl:template>
</xsl:stylesheet>