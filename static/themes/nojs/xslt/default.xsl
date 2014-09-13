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
    <xsl:import href="common.xsl" />
    <xsl:output method="html" encoding="UTF-8"/>

    <xsl:param name="window_title" select="'Theodorus'"/>
    <xsl:param name="app_name" select="'תיאודורוס'"/>
    <xsl:param name="javascript_disabled_title" select="'הפעלת קוד גאוהסקריפט אינה זמינה בדפדפן האינטרנט שלך'"/>
    <xsl:param name="javascript_disabled_instructions" select="'כרגע אין תמיכה לדפדנים ללא תמיכה בגאוהסקריפט'"/>
    <xsl:param name="system_loading" select="'טוען קבצים, אנא המתן...'"/>

    <xsl:variable name="errorMessages">
        <error type="name-too-short">שם המשתמש קצר מדי</error>
        <error type="passwords-dont-match">הסיסמאות אינן תואמות</error>
        <error type="password-too-short">הסיסמא קצרה מדי</error>
        <error type="password-too-simple">הסיסמא פשוטה מדי</error>
        <error type="terms-of-use-not-approved">תנאי השימוש לא אושרו</error>
        <error type="uid-is-invalid">'מספר הזהות איננו חוקי</error>
        <error type="email-is-invalid">כתובת הדואל איננה חוקית</error>
        <error type="email-in-use">כתובת הדואל שבחרת כבר רשומה במערכת</error>
        <error type="name-too-short">השם שבחרת קצר מדי</error>
        <error type="name-in-use">השם שבחרת כבר בשימוש</error>
        <error type="method-not-implemented">המתודה טרם יושמה</error>
        <error type="bad-credentials">פרטי ההתחברות שגויים</error>
        <error type="no-permission">אין לך הרשאות לפעולה זו</error>
        <error type="no-permission">לא ניתן להסיר פריט</error>
        <error type="unknown_error">שגיאה לא ידועה</error>
    </xsl:variable>

    <xsl:variable name="infoMessages">
        <error type="authenticating">מאמת נתונים</error>
        <error type="sending-data">שולח מידע</error>
    </xsl:variable>

    <xsl:variable name="timestamps">
        <timeLabel id="just-now">הרגע</timeLabel>
        <timeLabel id="a-minute-ago">לפני דקה</timeLabel>
        <timeLabel id="two-mintues-ago">לפני דקותיים</timeLabel>
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
    <xsl:param name="lbl_name" select="'שם'"/>
    <xsl:param name="lbl_name_example" select="'לדוגמא: ישראל ישראלי'"/>
    <xsl:param name="lbl_email" select="'דואל'"/>
    <xsl:param name="lbl_email_example" select="'כתובת: israel@gmail.com'"/>
    <xsl:param name="lbl_password" select="'סיסמא'"/>
    <xsl:param name="lbl_repeat_password" select="'סיסמה בשנית'"/>
    <xsl:param name="lbl_terms_of_use" select="'אני מאשר שקראתי ואני מסכים לפעול לפי כללי השימוש במערכת'"/>
    <xsl:param name="lbl_remember_me" select="'זכור אותי'"/>
    <xsl:param name="password_security_instructions">
        <ul>
            <h3>איך לבחור סיסמא מאובטחת?</h3>
            <li>
                <h4>סיסמא לא מאובטחת</h4>
                <ul>
                    <li>3 תוים לפחות</li>
                    <li>כל התוים שייכים לאותה קבוצה (ספרות, אותיות גדולות, אותיות קטנות)</li>
                    <li>דוגמאות: “easy”,”8892″,”NOTSECURE”</li>
                </ul>
            </li>
            <li>
                <h4>סיסמא סבירה</h4>
                <ul>
                    <li>6 תוים לפחות</li>
                    <li>שילוב של ספרות ואותיות</li>
                    <li>לדוגמא: “common1″,”7etmein”</li>
                </ul>
            </li>
            <li>
                <h4>סיסמא מאובטחת</h4>
                <ul>
                    <li>8 תוים לפחות</li>
                    <li>שילוב של אותיות גדולות וקטנות עם ספרות או סימנים מיוחדים</li>
                    <li>לדוגמא: “15NotEasy”,”Bett.er-Yet”</li>
                </ul>
            </li>
            <li>
                <h4>סיסמא סופר-מאובטחת</h4>
                <ul>
                    <li>8 תוים לפחות</li>
                    <li>שילוב של כל קבוצות התוים האפשריות</li>
                    <li>לדוגמא: ”o0Q!i9W@e3”</li>
                </ul>
            </li>
        </ul>
    </xsl:param>
    <xsl:param name="terms_of_use">
        <ol>
            <li>אין לעודד אלימות</li>
            <li>אין לפרסם תוכן שיווקי שאיננו רלוונטי לדיון</li>
            <li>אין לפגוע בזכויות יוצרים</li>
            <li>המשתמש/ת הינו/הינה האחראי/ת הבלעדי/ת לתוכן שהוא/היא פירסם/פירסמה</li>
        </ol>
    </xsl:param>

    <xsl:param name="signout_title" select="'תודה ולהתראות'"/>
    <xsl:param name="btn_signout" select="'התנתק'"/>
    <xsl:param name="btn_signin" select="'התחבר'"/>
    <xsl:param name="btn_signup" select="'הצטרף'"/>
    <xsl:param name="btn_cancel" select="'ביטול'"/>
    <xsl:param name="welcome" select="'ברוכים הבאים'"/>
    <xsl:param name="welcome_back" select="'ברוכים השבים'"/>

    <xsl:param name="lbl_topic_title" select="'כותרת'"/>
    <xsl:param name="example_topic_title">לדוגמא: לכל אזרח תהיה האפשרות להציע חוקים והצעות פופריות יהפכו לטיוטה משותפת שבסופו של דבר תעמוד לסוג של משאל עם</xsl:param>
    <xsl:param name="characters_left" select="'תוים נותרו'"/>
    <xsl:param name="lbl_topic_slug" select="'כתובת slug (באנגלית)'"/>
    <xsl:param name="example_topic_title_slug" select="'democracy-for-everyone'"/>
    <xsl:variable name="slugResults">
        <result type="slug-too-short">כתובת קצרה מדי</result>
        <result type="slug-is-invalid">כתובת לא תקנית</result>
        <result type="slug-not-available">כתובת לא זמינה</result>
        <result type="slug-is-available">כתובת זמינה</result>
    </xsl:variable>
    <xsl:param name="lbl_topic_tags" select="'תגיות'"/>
    <xsl:param name="example_topic_tags" select="'ממשל'"/>
    <xsl:param name="btn_suggest" select="'הצע'"/>
    <xsl:param name="lbl_tags" select="'תגיות'"/>

    <xsl:param name="lbl_topic_feedback" select="'משוב'"/>
    <xsl:param name="link_suggest_topic" select="'הצע רעיון'"/>
    <xsl:param name="btn_endorse" select="'תומכים'"/>
    <xsl:param name="btn_send_endorse" select="'תמוך'"/>
    <xsl:param name="btn_follow" select="'עוקבים'"/>
    <xsl:param name="btn_send_follow" select="'עקוב'"/>
    <xsl:param name="btn_report" select="'דיווחים'"/>
    <xsl:param name="btn_send_report" select="'דווח'"/>
    <xsl:param name="lbl_comments" select="'תגובות'"/>
    <xsl:param name="lbl_send_comment" select="'הגב'"/>
    <xsl:param name="btn_comment" select="'תגובות'"/>
    <xsl:param name="btn_send_comemnt" select="'הגב'"/>

    <xsl:param name="file_not_found_title" select="'הפריט שחיפשת לא קיים'"/>
    <xsl:param name="file_not_found-what_to_do">
        <p>עימך הסליחה, אבל הפריט אליו ניסית לגשת לא קיים</p>
        <ul>
            <li>ייתכן ויש שגיאה בכתובת?</li>
            <li>ייתכן והלינק לא מעודכן?</li>
        </ul>
        <p>חזור ל<a href="/">דף הראשי</a></p>
    </xsl:param>

    <xsl:param name="failed_to_load_topic" select="'טעינת פריט נכשלה'"/>
    <xsl:param name="tweet" select="'ציוץ'"/>

    <xsl:template match="/">
        <xsl:apply-templates />
    </xsl:template>
</xsl:stylesheet>