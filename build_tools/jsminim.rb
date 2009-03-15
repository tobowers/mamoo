#!/usr/bin/env ruby
# a cleanup and objectification of Uladzislau Latynski's straight translation
# of jsmin.c into ruby

require 'stringio'

class JsminImproved
  EOF = -1

  SPACE = ' '[0]

  def initialize(source_io, sink_io)
    @source_io = source_io
    @sink_io = sink_io
    @the_a = ""
    @the_b = ""
  end

  # isAlphanum -- return true if the character is a letter, digit, underscore,
  # dollar sign, or non-ASCII character
  def isAlphanum(c)
    return false if (!c || c == EOF)
    i = c[0]
    return ((i >= ?a && i <= ?z) || (i >= ?0 && i <= ?9) ||
            (i >= ?A && i <= ?Z) || i == ?_ || i == ?$ || i == ?\\ || i > 126)
  end

  # get -- return the next character from stdin. Watch out for lookahead. If
  # the character is a control character, translate it to a space or linefeed.
  def get()
    i = @source_io.getc
    return EOF if(!i)
    c = i.chr
    return c if (i >= SPACE || i == ?\n || c.unpack("c") == EOF)
    return "\n" if (i == ?\r)
    return " "
  end

  # Get the next character without getting it.
  def peek()
    lookaheadChar = @source_io.getc
    @source_io.ungetc(lookaheadChar)
    return lookaheadChar.chr
  end

  # mynext -- get the next character, excluding comments.
  # peek() is used to see if a '/' is followed by a '/' or '*'.
  def mynext()
    c = get
    
    if (c == "/")
      if (peek == "/")
        while(true)
          c = get
          if (c[0] <= ?\n)
          return c
          end
        end
      end
      if (peek == "*")
        get
        while (true)
          case get
          when "*"
          if (peek == "/")
              get
              return " "
            end
          when EOF
            raise "Unterminated comment"
          end
        end
      end
    end
    return c
  end


  # action -- do something! What you do is determined by the argument: 1
  # Output A. Copy B to A. Get the next B. 2 Copy B to A. Get the next B.
  # (Delete A). 3 Get the next B. (Delete B). action treats a string as a
  # single character. Wow! action recognizes a regular expression if it is
  # preceded by ( or , or =.
  def action(a)
    if (a==1)
      @sink_io.write @the_a
    end
    if (a==1 || a==2)
      @the_a = @the_b
      if (@the_a == "\'" || @the_a == "\"")
        while (true)
          @sink_io.write @the_a
          @the_a = get
          break if (@the_a == @the_b)
          raise "Unterminated string literal" if (@the_a <= "\n")
          if (@the_a == "\\")
            @sink_io.write @the_a
            @the_a = get
          end
        end
      end
    end
    if (a==1 || a==2 || a==3)
      @the_b = mynext
      if (@the_b == "/" && (@the_a == "(" || @the_a == "," || @the_a == "=" ||
          @the_a == ":" || @the_a == "[" || @the_a == "!" ||
          @the_a == "&" || @the_a == "|" || @the_a == "?"))
        @sink_io.write @the_a
        @sink_io.write @the_b
        while (true)
          @the_a = get
          if (@the_a == "/")
            break
          elsif (@the_a == "\\")
            @sink_io.write @the_a
            @the_a = get
          elsif (@the_a <= "\n")
            raise "Unterminated RegExp Literal"
          end
          @sink_io.write @the_a
        end
        @the_b = mynext
      end
    end
  end

  # jsmin -- Copy the input to the output, deleting the characters which are
  # insignificant to JavaScript. Comments will be removed. Tabs will be
  # replaced with spaces. Carriage returns will be replaced with linefeeds.
  # Most spaces and linefeeds will be removed.
  def jsmin
    @the_a = "\n"
    action(3)
    while (@the_a != EOF)
      case @the_a
      when " "
        if (isAlphanum(@the_b))
          action(1)
        else
          action(2)
        end
      when "\n"
        case (@the_b)
        when "{","[","(","+","-"
          action(1)
        when " "
          action(3)
        else
          if (isAlphanum(@the_b))
            action(1)
          else
            action(2)
          end
        end
      else
        case (@the_b)
        when " "
          if (isAlphanum(@the_a))
            action(1)
          else
            action(3)
          end
        when "\n"
          case (@the_a)
          when "}","]",")","+","-","\"","\\"
            action(1)
          else
            if (isAlphanum(@the_a))
              action(1)
            else
              action(3)
            end
          end
        else
          action(1)
        end
      end
    end
  end

  # +input+ can be either a string or an IO
  # returns the javascript read from input as a string
  def self.jsmin(input)
    result = ''
    result_io = StringIO.new(result)

    in_io = 
      case input
      when String
        StringIO.new(input)
      when IO
        StringIO.new(input.read())   # read input into a buffer
      end

    self.new(in_io, result_io).jsmin
    return result
  end

  # if invoked on the command line, this method is run, using
  # stdin/stdout as source/sink
  def self.main
    $stdout.write(self.jsmin($stdin))
  end
end

JsminImproved.main if __FILE__ == $0

