import java.util.LinkedHashMap;
import java.util.Map;

import org.worldcubeassociation.tnoodle.scrambles.Puzzle;
import org.worldcubeassociation.tnoodle.scrambles.PuzzleRegistry;

public class TNoodleSingleScramble {
  private static final Map<String, PuzzleRegistry> EVENTS = new LinkedHashMap<>();

  static {
    EVENTS.put("222", PuzzleRegistry.TWO);
    EVENTS.put("333", PuzzleRegistry.THREE);
    EVENTS.put("444", PuzzleRegistry.FOUR);
    EVENTS.put("555", PuzzleRegistry.FIVE);
    EVENTS.put("666", PuzzleRegistry.SIX);
    EVENTS.put("777", PuzzleRegistry.SEVEN);
    EVENTS.put("333bf", PuzzleRegistry.THREE_NI);
    EVENTS.put("333fm", PuzzleRegistry.THREE_FM);
    EVENTS.put("333oh", PuzzleRegistry.THREE);
    EVENTS.put("clock", PuzzleRegistry.CLOCK);
    EVENTS.put("minx", PuzzleRegistry.MEGA);
    EVENTS.put("pyram", PuzzleRegistry.PYRA);
    EVENTS.put("skewb", PuzzleRegistry.SKEWB);
    EVENTS.put("sq1", PuzzleRegistry.SQ1);
    EVENTS.put("444bf", PuzzleRegistry.FOUR_NI);
    EVENTS.put("555bf", PuzzleRegistry.FIVE_NI);
    EVENTS.put("333mbf", PuzzleRegistry.THREE_NI);
  }

  public static void main(String[] args) throws Exception {
    String event = args.length > 0 ? args[0] : "333";
    PuzzleRegistry registry = EVENTS.get(event);

    if (registry == null) {
      throw new IllegalArgumentException("Unsupported event: " + event);
    }

    Puzzle puzzle = registry.getScrambler();
    String scramble = puzzle.generateScramble();
    String svg = puzzle.drawScramble(scramble, puzzle.getDefaultColorScheme()).toString();

    System.out.print("{\"event\":\"");
    System.out.print(json(event));
    System.out.print("\",\"scramble\":\"");
    System.out.print(json(scramble));
    System.out.print("\",\"imageSvg\":\"");
    System.out.print(json(svg));
    System.out.print("\"}");
  }

  private static String json(String value) {
    StringBuilder escaped = new StringBuilder(value.length() + 16);
    for (int i = 0; i < value.length(); i += 1) {
      char ch = value.charAt(i);
      switch (ch) {
        case '\\':
          escaped.append("\\\\");
          break;
        case '"':
          escaped.append("\\\"");
          break;
        case '\n':
          escaped.append("\\n");
          break;
        case '\r':
          escaped.append("\\r");
          break;
        case '\t':
          escaped.append("\\t");
          break;
        default:
          if (ch < 0x20) {
            escaped.append(String.format("\\u%04x", (int) ch));
          } else {
            escaped.append(ch);
          }
      }
    }
    return escaped.toString();
  }
}
